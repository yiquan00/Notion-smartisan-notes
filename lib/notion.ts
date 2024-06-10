// lib/notion.ts
import { Client } from '@notionhq/client';

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default notion;