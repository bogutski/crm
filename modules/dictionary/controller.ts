import { Dictionary, DictionaryItem, IDictionary, IDictionaryItem } from './model';
import {
  DictionaryResponse,
  DictionaryItemResponse,
  DictionaryListResponse,
  DictionaryItemsListResponse,
  CreateDictionaryDTO,
  UpdateDictionaryDTO,
  CreateDictionaryItemDTO,
  UpdateDictionaryItemDTO,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// === Преобразователи в Response ===

function toDictionaryResponse(dict: IDictionary, itemCount?: number): DictionaryResponse {
  return {
    id: dict._id.toString(),
    code: dict.code,
    name: dict.name,
    description: dict.description,
    allowHierarchy: dict.allowHierarchy,
    maxDepth: dict.maxDepth,
    fields: dict.fields,
    itemCount,
    createdAt: dict.createdAt,
    updatedAt: dict.updatedAt,
  };
}

function toDictionaryItemResponse(item: IDictionaryItem): DictionaryItemResponse {
  return {
    id: item._id.toString(),
    dictionaryCode: item.dictionaryCode,
    code: item.code,
    name: item.name,
    weight: item.weight,
    parentId: item.parentId?.toString() || null,
    depth: item.depth,
    isActive: item.isActive,
    properties: item.properties,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// === CRUD для словарей ===

export async function getDictionaries(): Promise<DictionaryListResponse> {
  await dbConnect();

  const dictionaries = await Dictionary.find().sort({ name: 1 });

  // Подсчитываем количество элементов для каждого словаря
  const counts = await DictionaryItem.aggregate([
    { $group: { _id: '$dictionaryCode', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  return {
    dictionaries: dictionaries.map((d) =>
      toDictionaryResponse(d, countMap.get(d.code) || 0)
    ),
    total: dictionaries.length,
  };
}

export async function getDictionaryByCode(code: string): Promise<DictionaryResponse | null> {
  await dbConnect();

  const dictionary = await Dictionary.findOne({ code });
  if (!dictionary) return null;

  const itemCount = await DictionaryItem.countDocuments({ dictionaryCode: code });
  return toDictionaryResponse(dictionary, itemCount);
}

export async function createDictionary(data: CreateDictionaryDTO): Promise<DictionaryResponse> {
  await dbConnect();

  const dictionary = await Dictionary.create({
    code: data.code.toLowerCase(),
    name: data.name,
    description: data.description,
    allowHierarchy: data.allowHierarchy ?? false,
    maxDepth: data.maxDepth ?? 1,
    fields: data.fields ?? [],
  });

  return toDictionaryResponse(dictionary, 0);
}

export async function updateDictionary(
  code: string,
  data: UpdateDictionaryDTO
): Promise<DictionaryResponse | null> {
  await dbConnect();

  const dictionary = await Dictionary.findOneAndUpdate(
    { code },
    { $set: data },
    { new: true }
  );

  if (!dictionary) return null;

  const itemCount = await DictionaryItem.countDocuments({ dictionaryCode: code });
  return toDictionaryResponse(dictionary, itemCount);
}

export async function deleteDictionary(code: string): Promise<boolean> {
  await dbConnect();

  // Удаляем словарь и все его элементы
  const [dictResult] = await Promise.all([
    Dictionary.findOneAndDelete({ code }),
    DictionaryItem.deleteMany({ dictionaryCode: code }),
  ]);

  return !!dictResult;
}

// === CRUD для элементов словаря ===

export async function getDictionaryItems(
  dictionaryCode: string,
  includeInactive = false
): Promise<DictionaryItemsListResponse> {
  await dbConnect();

  const query: Record<string, unknown> = { dictionaryCode };
  if (!includeInactive) {
    query.isActive = true;
  }

  const items = await DictionaryItem.find(query).sort({ weight: 1, name: 1 });

  return {
    items: items.map(toDictionaryItemResponse),
    total: items.length,
  };
}

export async function getDictionaryItemById(id: string): Promise<DictionaryItemResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const item = await DictionaryItem.findById(id);
  return item ? toDictionaryItemResponse(item) : null;
}

export async function getDictionaryItemByCode(
  dictionaryCode: string,
  itemCode: string
): Promise<DictionaryItemResponse | null> {
  await dbConnect();

  const item = await DictionaryItem.findOne({ dictionaryCode, code: itemCode });
  return item ? toDictionaryItemResponse(item) : null;
}

export async function createDictionaryItem(
  data: CreateDictionaryItemDTO
): Promise<DictionaryItemResponse> {
  await dbConnect();

  // Вычисляем weight - следующий по порядку
  const maxWeightItem = await DictionaryItem.findOne({
    dictionaryCode: data.dictionaryCode,
    parentId: data.parentId || null,
  }).sort({ weight: -1 });

  const weight = (maxWeightItem?.weight ?? -1) + 1;

  // Вычисляем depth на основе родителя
  let depth = 0;
  if (data.parentId) {
    const parent = await DictionaryItem.findById(data.parentId);
    if (parent) {
      depth = parent.depth + 1;
    }
  }

  const item = await DictionaryItem.create({
    dictionaryCode: data.dictionaryCode,
    code: data.code || undefined,
    name: data.name,
    weight,
    parentId: data.parentId || null,
    depth,
    isActive: true,
    properties: data.properties || {},
  });

  return toDictionaryItemResponse(item);
}

export async function updateDictionaryItem(
  id: string,
  data: UpdateDictionaryItemDTO
): Promise<DictionaryItemResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  // Если меняется родитель, пересчитываем depth
  const updateData: Record<string, unknown> = { ...data };
  if (data.parentId !== undefined) {
    if (data.parentId) {
      const parent = await DictionaryItem.findById(data.parentId);
      updateData.depth = parent ? parent.depth + 1 : 0;
    } else {
      updateData.depth = 0;
    }
  }

  const item = await DictionaryItem.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  return item ? toDictionaryItemResponse(item) : null;
}

export async function deleteDictionaryItem(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  // Находим элемент для получения dictionaryCode и parentId
  const item = await DictionaryItem.findById(id);
  if (!item) return false;

  // Удаляем элемент и обновляем дочерние элементы (перемещаем к родителю удаляемого)
  await Promise.all([
    DictionaryItem.findByIdAndDelete(id),
    DictionaryItem.updateMany(
      { parentId: item._id },
      { $set: { parentId: item.parentId, depth: item.depth } }
    ),
  ]);

  return true;
}

// === Управление порядком ===

export async function updateItemsOrder(
  items: Array<{ id: string; weight: number; parentId?: string | null }>
): Promise<boolean> {
  await dbConnect();

  const bulkOps = items.map((item) => {
    const update: Record<string, unknown> = { weight: item.weight };
    if (item.parentId !== undefined) {
      update.parentId = item.parentId ? new mongoose.Types.ObjectId(item.parentId) : null;
    }
    return {
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(item.id) },
        update: { $set: update },
      },
    };
  });

  await DictionaryItem.bulkWrite(bulkOps);
  return true;
}

// === Получение элементов с иерархией ===

export async function getDictionaryItemsTree(
  dictionaryCode: string
): Promise<DictionaryItemResponse[]> {
  await dbConnect();

  const items = await DictionaryItem.find({
    dictionaryCode,
    isActive: true,
  }).sort({ weight: 1 });

  const itemsMap = new Map<string, DictionaryItemResponse>();
  const rootItems: DictionaryItemResponse[] = [];

  // Первый проход - создаём все элементы
  for (const item of items) {
    const response = toDictionaryItemResponse(item);
    response.children = [];
    itemsMap.set(response.id, response);
  }

  // Второй проход - строим дерево
  for (const item of items) {
    const response = itemsMap.get(item._id.toString())!;
    if (item.parentId) {
      const parent = itemsMap.get(item.parentId.toString());
      if (parent) {
        parent.children!.push(response);
      } else {
        rootItems.push(response);
      }
    } else {
      rootItems.push(response);
    }
  }

  return rootItems;
}
