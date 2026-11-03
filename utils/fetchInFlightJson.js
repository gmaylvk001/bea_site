const inFlightRequests = new Map();

export default function fetchInFlightJson(url, options) {
  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) return existingRequest;

  const request = fetch(url, options).then((response) => response.json());
  inFlightRequests.set(url, request);

  const clearRequest = () => {
    if (inFlightRequests.get(url) === request) {
      inFlightRequests.delete(url);
    }
  };
  request.then(clearRequest, clearRequest);

  return request;
}
