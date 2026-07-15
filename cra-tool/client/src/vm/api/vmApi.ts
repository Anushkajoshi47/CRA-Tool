import api from '../../api';
import type { Ticket, Report, Advisory, StatusHistoryEntry, TicketNotification } from '../../types';

// Tickets
export const getTickets       = ()                 => api.get<Ticket[]>('/vm/tickets');
export const getTicket        = (id: string)       => api.get<Ticket>(`/vm/tickets/${id}`);
export const createTicket     = (data: Partial<Ticket>)             => api.post<Ticket>('/vm/tickets', data);
export const updateTicket     = (id: string, data: Partial<Ticket>) => api.patch<Ticket>(`/vm/tickets/${id}`, data);
export const transitionTicket = (id: string, data: { toStatus: string; note?: string; classification?: string; cvss?: any }) =>
  api.post<Ticket>(`/vm/tickets/${id}/transition`, data);
export const updateStageData = (id: string, data: Pick<Partial<Ticket>, 'remediation' | 'advisoryChecks' | 'disclosure'>) =>
  api.patch<Ticket>(`/vm/tickets/${id}/stage-data`, data);
export const notifyCert = (id: string, data: { note?: string } = {}) =>
  api.post<Ticket>(`/vm/tickets/${id}/notify-cert`, data);
export const resetCertNotification = (id: string) =>
  api.delete<Ticket>(`/vm/tickets/${id}/notify-cert`);
export const deleteTicket = (id: string) =>
  api.delete(`/vm/tickets/${id}`);
export const getTicketHistory = (id: string)       => api.get<StatusHistoryEntry[]>(`/vm/tickets/${id}/history`);
export const getTicketNotifications = (id: string) => api.get<TicketNotification[]>(`/vm/tickets/${id}/notifications`);

// Reports
export const getReports   = (ticketId: string)                  => api.get<Report[]>(`/vm/reports?ticketId=${ticketId}`);
export const createReport = (data: Partial<Report>)             => api.post<Report>('/vm/reports', data);
export const updateReport = (id: string, data: Partial<Report>) => api.patch<Report>(`/vm/reports/${id}`, data);
export const deleteReport = (id: string)                        => api.delete(`/vm/reports/${id}`);

// Advisories
export const getAdvisories  = (ticketId?: string) => api.get<Advisory[]>(`/vm/advisories${ticketId ? `?ticketId=${ticketId}` : ''}`);
export const getAdvisory    = (id: string)                          => api.get<Advisory>(`/vm/advisories/${id}`);
export const createAdvisory = (data: Partial<Advisory>)             => api.post<Advisory>('/vm/advisories', data);
export const updateAdvisory = (id: string, data: Partial<Advisory>) => api.patch<Advisory>(`/vm/advisories/${id}`, data);
