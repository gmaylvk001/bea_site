/** Shared noindex metadata for private / transactional pages. */
export const noIndexMetadata = {
  robots: "noindex, nofollow",
};

export default function NoIndexRobots() {
  return <meta name="robots" content="noindex, nofollow" />;
}
