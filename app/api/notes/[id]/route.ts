import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// 处理 GET 请求：获取笔记列表
// 获取特定笔记详情和内容块的API
export async function GET(request, { params: { id } }) {
  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  try {
    const pageResponse = await notion.pages.retrieve({ page_id: id });
    const blocksResponse = await notion.blocks.children.list({ block_id: id });

    return NextResponse.json({
      page: pageResponse,
      blocks: blocksResponse.results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 处理 POST 请求：新建笔记
export async function POST(request) {
  try {
    const { title, content } = await request.json();
    console.log('Received POST request with data:', { title, content });

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ type: 'text', text: { content: title } }],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content } }],
          },
        },
      ],
    });

    console.log('Notion API response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 处理 DELETE 请求：删除笔记（归档逻辑）
export async function DELETE(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  try {
    // 使用 Notion API 归档页面而不是直接删除
    const response = await notion.pages.update({
      page_id: id,
      archived: true,
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}