'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '../../style/noteDetails.css'; 

interface Note {
  id: string;
  properties: {
    Name: {
      title: { text: { content: string } }[];
    };
    'Last edited time': {
      last_edited_time: string;
    };
  };
  created_time: string;
  last_edited_time: string;
}

interface RichText {
  type: string;
  text: { content: string };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

interface Block {
  id: string;
  type: string;
  has_children: boolean;
  parent: {
    type: string;
    block_id?: string;
    page_id?: string;
  };
  paragraph?: { rich_text: RichText[] };
  heading_1?: { rich_text: RichText[] };
  heading_2?: { rich_text: RichText[] };
  heading_3?: { rich_text: RichText[] };
  bulleted_list_item?: { rich_text: RichText[] };
  numbered_list_item?: { rich_text: RichText[] };
  image?: { external?: { url: string }, file?: { url: string } };
  toggle?: { rich_text: RichText[] };
  quote?: { rich_text: RichText[] };
  code?: { rich_text: RichText[], language: string };
  [key: string]: any; // For any additional block types
}

const NoteDetails = () => {
  const router = useRouter();
  const { id } = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (id && id !== 'new') {
      fetchNoteAndBlocks();
    }
  }, [id]);

  const fetchNoteAndBlocks = async () => {
    try {
      const response = await fetch(`/api/notes/${id}`);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        setNote(data.page);
        setBlocks(data.blocks);
      } else {
        setErrorMessage('Failed to fetch note details.');
      }
    } catch (error) {
      setErrorMessage(error.toString());
    }
  };

  if (id === 'new') {
    router.push('/notes/new');
    return null;
  }

  if (errorMessage) {
    return <div className="text-red-500">{errorMessage}</div>;
  }

  if (!note) {
    return <div>Loading...</div>;
  }

  const formatDateString = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getNoteTitle = (note: Note) => {
    if (
      note &&
      note.properties &&
      note.properties.Name &&
      note.properties.Name.title &&
      note.properties.Name.title[0] &&
      note.properties.Name.title[0].text &&
      note.properties.Name.title[0].text.content
    ) {
      return note.properties.Name.title[0].text.content;
    }
    return 'No title';
  };

  const renderRichText = (richTexts: RichText[]) => {
    return richTexts.map((richText, index) => {
      const { annotations } = richText;

      const styles: React.CSSProperties = {
        color: annotations.color !== 'default' ? annotations.color : undefined,
        fontWeight: annotations.bold ? 'bold' : 'normal',
        fontStyle: annotations.italic ? 'italic' : 'normal',
        textDecoration: `${annotations.strikethrough ? 'line-through ' : ''}${annotations.underline ? 'underline' : ''}`,
        fontFamily: annotations.code ? 'monospace' : 'inherit'
      };

      return <span key={index} style={styles}>{richText.text.content}</span>;
    });
  };


  const renderBlocks = (blocks: Block[], numberedListIndex: { [key: string]: number } = {}, listType: 'ul' | 'ol' | null = null) => {
    return blocks.map((block, index) => {
      switch (block.type) {
        case 'paragraph':
          return <p key={block.id}>{renderRichText(block.paragraph.rich_text)}</p>;
        case 'heading_1':
          return <h1 key={block.id}>{renderRichText(block.heading_1.rich_text)}</h1>;
        case 'heading_2':
          return <h2 key={block.id}>{renderRichText(block.heading_2.rich_text)}</h2>;
        case 'heading_3':
          return <h3 key={block.id}>{renderRichText(block.heading_3.rich_text)}</h3>;
        case 'bulleted_list_item':
          return (
            <ul key={block.id} className="list-disc list-inside">
              <li>
                {renderRichText(block.bulleted_list_item.rich_text)}
                {block.has_children && block.children && renderBlocks(block.children, numberedListIndex, 'ul')}
              </li>
            </ul>
          );
        case 'numbered_list_item':
          const parentId = block.parent.block_id || block.parent.page_id;
          if (!numberedListIndex[parentId]) {
            numberedListIndex[parentId] = 1;
          }
          const prefix = numberedListIndex[parentId] + '. ';
          numberedListIndex[parentId] += 1;
          return (
            <ol key={block.id} start={numberedListIndex[parentId] - 1} className="list-decimal list-inside">
              <li>
                {renderRichText(block.numbered_list_item.rich_text)}
                {block.has_children && block.children && renderBlocks(block.children, numberedListIndex, 'ol')}
              </li>
            </ol>
          );
        case 'image':
          return (
            <img
              key={block.id}
              src={block.image.external?.url || block.image.file?.url}
              alt="Image"
              width="300"
            />
          );
        case 'toggle':
          return (
            <details key={block.id}>
              <summary>{renderRichText(block.toggle.rich_text)}</summary>
              {block.has_children && block.children && renderBlocks(block.children)}
            </details>
          );
        case 'quote':
          return (
            <blockquote key={block.id} className="pl-4 border-l-4 border-gray-300">
              {renderRichText(block.quote.rich_text)}
            </blockquote>
          );
        case 'code':
          return (
            <pre key={block.id} className="bg-gray-100 p-2 rounded">
              <code>{renderRichText(block.code.rich_text)}</code>
            </pre>
          );
        default:
          return <div key={block.id}>Unsupported block type: {block.type}</div>;
      }
    });
  };

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-lg font-semibold">← 返回</button>
      <div className="mt-4">
        <h1 className="text-2xl font-bold">
          {getNoteTitle(note)}
        </h1>
        <div className="text-gray-500 text-xs mb-1">
          最后编辑时间：{formatDateString(note.last_edited_time)}
        </div>
        <div className="text-gray-500 text-xs mb-1">
          创建时间：{formatDateString(note.created_time)}
        </div>
        <div className="mt-2">
          {renderBlocks(blocks)}
        </div>
      </div>
    </div>
  );
};

export default NoteDetails;