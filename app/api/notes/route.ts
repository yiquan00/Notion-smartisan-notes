import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startCursor = searchParams.get('startCursor');
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor || undefined,
      page_size: pageSize,
      sorts: [
        {
          property: 'Last edited time',
          direction: 'descending',
        },
      ],
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, content } = await request.json();
    console.log('Received title:', title); // 添加日志：收到的标题
    console.log('Received content:', content); // 添加日志：收到的内容

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

    console.log('Notion API response:', response); // 添加日志：Notion API响应

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating note:', error); // 添加错误日志
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  try {
    // Note: Notion API does not支持直接删除页面，只能归档页面。
    const response = await notion.pages.update({
      page_id: id,
      archived: true
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}