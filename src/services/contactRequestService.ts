import { apiFetch, handleResponse } from '../config/api'

export { ApiError } from '../config/api'

export type ContactRequestStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED'

export interface ContactRequest {
  id: number
  senderName: string
  senderEmail: string
  message: string
  status: ContactRequestStatus
  createdAt: string
  item: {
    id: number
    title: string
    category: string
    location: string
  }
}

export interface ContactRequestInput {
  itemId: number
  senderName: string
  senderEmail: string
  message: string
}

export async function getContactRequests(): Promise<ContactRequest[]> {
  return handleResponse<ContactRequest[]>(await apiFetch('/contact-requests'))
}

export async function getContactRequestsByItem(itemId: number): Promise<ContactRequest[]> {
  return handleResponse<ContactRequest[]>(
    await apiFetch(`/contact-requests/item/${itemId}`),
  )
}

export async function createContactRequest(input: ContactRequestInput): Promise<ContactRequest> {
  return handleResponse<ContactRequest>(
    await apiFetch('/contact-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateContactRequestStatus(
  id: number,
  status: ContactRequestStatus,
): Promise<ContactRequest> {
  const params = new URLSearchParams()
  params.set('status', status)

  return handleResponse<ContactRequest>(
    await apiFetch(`/contact-requests/${id}/status?${params.toString()}`, {
      method: 'PUT',
    }),
  )
}