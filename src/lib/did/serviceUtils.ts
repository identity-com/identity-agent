import { DIDDocument, ServiceEndpoint } from 'did-resolver';
import { PayloadType } from '@/service/transport/Transport';
import { propEq } from 'ramda';

const payloadTypeToService: Record<PayloadType, string> = {
  Presentation: 'MessagingService',
  PresentationRequest: 'MessagingService',
  Message: 'MessagingService',
};

export const serviceFor = (
  didDocument: DIDDocument,
  type: PayloadType
): ServiceEndpoint | undefined =>
  getService(didDocument, payloadTypeToService[type]);

export const getService = (
  didDocument: DIDDocument,
  serviceType: string
): ServiceEndpoint | undefined => {
  const services = didDocument.service || [];
  return services.find(propEq('type', serviceType));
};
