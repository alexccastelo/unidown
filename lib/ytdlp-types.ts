export type VideoFormat = {
  formatId: string;
  ext: string;
  resolution: string | null;
  filesize: number | null;
  vcodec: string | null;
  acodec: string | null;
  tbr: number | null;
  hasAudio: boolean;
};

export type VideoInfo = {
  id: string;
  title: string;
  uploader: string | null;
  uploaderId: string | null;
  thumbnail: string | null;
  duration: number | null;
  description: string | null;
  webpageUrl: string;
  formats: VideoFormat[];
  bestFormatId: string | null;
  ext: string;
};
