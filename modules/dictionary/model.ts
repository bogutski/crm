import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс поля словаря
export interface IDictionaryField {
  code: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'icon';
  required: boolean;
}

// Интерфейс документа словаря
export interface IDictionary extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  allowHierarchy: boolean;
  maxDepth: number;
  fields: IDictionaryField[];
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейс документа элемента словаря
export interface IDictionaryItem extends Document {
  _id: mongoose.Types.ObjectId;
  dictionaryCode: string;
  code?: string; // уникальный код в рамках словаря (для связей)
  name: string;
  weight: number;
  parentId: mongoose.Types.ObjectId | null;
  depth: number;
  isActive: boolean;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Схема поля словаря
const DictionaryFieldSchema = new Schema<IDictionaryField>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'color', 'icon'],
      required: true
    },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

// Схема словаря
const DictionarySchema = new Schema<IDictionary>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    allowHierarchy: { type: Boolean, default: false },
    maxDepth: { type: Number, default: 1, min: 1, max: 3 },
    fields: { type: [DictionaryFieldSchema], default: [] },
  },
  { timestamps: true }
);

// Индексы для словаря (code уже имеет unique: true в схеме)
DictionarySchema.index({ name: 'text' });

// Схема элемента словаря
const DictionaryItemSchema = new Schema<IDictionaryItem>(
  {
    dictionaryCode: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // позволяет null/undefined при уникальности
    },
    name: { type: String, required: true, trim: true },
    weight: { type: Number, default: 0 },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'DictionaryItem',
      default: null,
    },
    depth: { type: Number, default: 0, min: 0, max: 2 },
    isActive: { type: Boolean, default: true },
    properties: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Индексы для элементов словаря
DictionaryItemSchema.index({ dictionaryCode: 1, weight: 1 });
DictionaryItemSchema.index({ dictionaryCode: 1, parentId: 1 });
DictionaryItemSchema.index({ dictionaryCode: 1, name: 'text' });
// Partial index: уникальность только когда code существует и не null
DictionaryItemSchema.index(
  { dictionaryCode: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } }
);

// Модели
export const Dictionary = mongoose.models.Dictionary || mongoose.model<IDictionary>('Dictionary', DictionarySchema);
export const DictionaryItem = mongoose.models.DictionaryItem || mongoose.model<IDictionaryItem>('DictionaryItem', DictionaryItemSchema);

export default { Dictionary, DictionaryItem };
