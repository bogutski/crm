import mongoose from 'mongoose';
import Contact, { IContact, IContactType } from './model';
import {
  CreateContactDTO,
  UpdateContactDTO,
  ContactResponse,
  ContactsListResponse,
  ContactFilters,
  ContactTypeResponse,
  OwnerResponse,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
// Импортируем DictionaryItem и User чтобы модели были зарегистрированы для populate
import '@/modules/dictionary/model';
import '@/modules/user/model';

function toContactTypeResponse(contactType: mongoose.Types.ObjectId | IContactType | undefined): ContactTypeResponse | null {
  if (!contactType) return null;

  // Если это ObjectId (не был populate), возвращаем null
  if (contactType instanceof mongoose.Types.ObjectId) {
    return null;
  }

  // Проверяем что это объект с _id (populated DictionaryItem)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ct = contactType as any;
  if (!ct._id || !ct.name) {
    return null;
  }

  return {
    id: ct._id.toString(),
    name: ct.name,
    color: ct.properties?.color,
  };
}

function toOwnerResponse(owner: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string; email: string } | undefined): OwnerResponse | null {
  if (!owner) return null;

  // Если это ObjectId (не был populate), возвращаем null
  if (owner instanceof mongoose.Types.ObjectId) {
    return null;
  }

  // Проверяем что это объект с _id (populated User)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = owner as any;
  if (!u._id || !u.name) {
    return null;
  }

  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
  };
}

function toContactResponse(contact: IContact): ContactResponse {
  return {
    id: contact._id.toString(),
    name: contact.name,
    emails: contact.emails || [],
    phones: contact.phones || [],
    company: contact.company,
    position: contact.position,
    notes: contact.notes,
    contactType: toContactTypeResponse(contact.contactType),
    source: contact.source,
    owner: toOwnerResponse(contact.ownerId as any),
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export async function getContacts(filters: ContactFilters): Promise<ContactsListResponse> {
  await dbConnect();

  const { search, ownerId, contactType, source, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'emails.address': { $regex: search, $options: 'i' } },
      { 'phones.e164': { $regex: search, $options: 'i' } },
      { 'phones.international': { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }

  if (contactType) {
    if (contactType === '_null_') {
      // Фильтр по пустым значениям (null или отсутствует)
      query.contactType = { $in: [null, undefined] };
    } else {
      query.contactType = contactType;
    }
  }

  if (source) {
    if (source === '_null_') {
      // Фильтр по пустым значениям (null или отсутствует)
      query.source = { $in: [null, undefined] };
    } else {
      query.source = source;
    }
  }

  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    Contact.find(query)
      .populate('contactType', '_id name properties')
      .populate('ownerId', '_id name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Contact.countDocuments(query),
  ]);

  return {
    contacts: contacts.map(toContactResponse),
    total,
    page,
    limit,
  };
}

export async function getContactById(id: string): Promise<ContactResponse | null> {
  await dbConnect();

  const contact = await Contact.findById(id)
    .populate('contactType', '_id name properties')
    .populate('ownerId', '_id name email');
  if (!contact) return null;

  return toContactResponse(contact);
}

export async function createContact(data: CreateContactDTO): Promise<ContactResponse> {
  await dbConnect();

  const contact = await Contact.create({
    name: data.name,
    emails: data.emails || [],
    phones: data.phones || [],
    company: data.company,
    position: data.position,
    notes: data.notes,
    contactType: data.contactType || undefined,
    source: data.source,
    ownerId: data.ownerId,
  });

  // Populate contactType и ownerId для ответа
  await contact.populate('contactType', '_id name properties');
  await contact.populate('ownerId', '_id name email');

  return toContactResponse(contact);
}

export async function updateContact(
  id: string,
  data: UpdateContactDTO
): Promise<ContactResponse | null> {
  await dbConnect();

  // Если contactType явно null, удаляем поле
  const updateData = { ...data };
  if (data.contactType === null) {
    await Contact.findByIdAndUpdate(id, { $unset: { contactType: 1 } });
    delete updateData.contactType;
  }

  const contact = await Contact.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  )
    .populate('contactType', '_id name properties')
    .populate('ownerId', '_id name email');

  if (!contact) return null;

  return toContactResponse(contact);
}

export async function deleteContact(id: string): Promise<boolean> {
  await dbConnect();

  const result = await Contact.findByIdAndDelete(id);
  return !!result;
}

export async function getContactsByOwner(ownerId: string): Promise<ContactResponse[]> {
  await dbConnect();

  const contacts = await Contact.find({ ownerId })
    .populate('contactType', '_id name properties')
    .populate('ownerId', '_id name email')
    .sort({ createdAt: -1 });
  return contacts.map(toContactResponse);
}
