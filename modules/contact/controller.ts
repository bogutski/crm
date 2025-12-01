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
    firstName: contact.firstName,
    lastName: contact.lastName,
    fullName: `${contact.firstName} ${contact.lastName}`,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    position: contact.position,
    status: contact.status,
    source: contact.source,
    notes: contact.notes,
    tags: contact.tags,
    ownerId: contact.ownerId.toString(),
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export async function getContacts(filters: ContactFilters): Promise<ContactsListResponse> {
  await dbConnect();

  const { search, status, ownerId, tags, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
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
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    company: data.company,
    position: data.position,
    status: data.status || 'lead',
    source: data.source,
    notes: data.notes,
    tags: data.tags || [],
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

export async function addTagToContact(id: string, tag: string): Promise<ContactResponse | null> {
  await dbConnect();

  const contact = await Contact.findByIdAndUpdate(
    id,
    { $addToSet: { tags: tag } },
    { new: true }
  );
  if (!contact) return null;

  return toContactResponse(contact);
}

export async function removeTagFromContact(id: string, tag: string): Promise<ContactResponse | null> {
  await dbConnect();

  const contact = await Contact.findByIdAndUpdate(
    id,
    { $pull: { tags: tag } },
    { new: true }
  );
  if (!contact) return null;

  return toContactResponse(contact);
}
