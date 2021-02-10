import { DIDDocument, ServiceEndpoint } from 'did-resolver';
import { PayloadType } from '@/service/transport/Transport';
import { propEq } from 'ramda';

const payloadTypeToService: Record<PayloadType, string> = {
  Presentation: 'AgentService',
  PresentationRequest: 'MessagingService',
  Message: 'MessagingService',
};

export const serviceFor = (
  didDocument: DIDDocument,
  type: PayloadType
): ServiceEndpoint | undefined => {
  const serviceType = payloadTypeToService[type];
  const services = didDocument.service || [];
  return services.find(propEq('type', serviceType));
};
