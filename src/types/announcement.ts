export type AnnouncementData = {
  id: string; // Firestore doc ID (YYYY-MM-DD)
  title: string;
  content: string; // markdown
  type: "info" | "warning" | "danger";
  showModal: boolean;
  publishedAt: string; // ISO string, serialized from Firestore Timestamp on server
};
