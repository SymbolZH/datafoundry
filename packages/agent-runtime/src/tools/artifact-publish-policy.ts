export const shouldReuseRecordedFileArtifactForPublish = (input: {
  existingFileArtifact: boolean;
  requestedType: string;
}): boolean =>
  input.existingFileArtifact &&
  (input.requestedType === "markdown" || input.requestedType === "html");
