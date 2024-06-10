import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// 确保环境变量可以被读取
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

export async function POST(request) {
  const { searchQuery } = await request.json();

  if (!searchQuery) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    console.log('Search Query:', searchQuery); // 打印查询信息

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Name',
        title: {
          contains: searchQuery,
        },
      },
    });

    console.log('Search Result:', response.results); // 打印查询结果
    
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error:', error); // 打印错误信息
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}