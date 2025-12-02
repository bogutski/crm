import Contact, { IContact } from './model';
import {
  CreateContactDTO,
  UpdateContactDTO,
  ContactResponse,
  ContactsListResponse,
  ContactFilters,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';

function toContactResponse(contact: IContact): ContactResponse {
  return {
    id: contact._id.toString(),
    name: contact.name,
    emails: contact.emails || [],
    phones: contact.phones || [],
    company: contact.company,
    position: contact.position,
    notes: contact.notes,
    contactType: contact.contactType,
    source: contact.source,
    ownerId: contact.ownerId.toString(),
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
    query.contactType = contactType;
  }

  if (source) {
    query.source = source;
  }

  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

  const contact = await Contact.findById(id);
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
    contactType: data.contactType,
    source: data.source,
    ownerId: data.ownerId,
  });

  return toContactResponse(contact);
}

export async function updateContact(
  id: string,
  data: UpdateContactDTO
): Promise<ContactResponse | null> {
  await dbConnect();

  const contact = await Contact.findByIdAndUpdate(id, { $set: data }, { new: true });
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

  const contacts = await Contact.find({ ownerId }).sort({ createdAt: -1 });
  return contacts.map(toContactResponse);
}
