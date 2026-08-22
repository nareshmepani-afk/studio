import React from 'react';

interface SchemaOrgProps {
  schema: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function SchemaOrg({ schema }: SchemaOrgProps) {
  const jsonLd = Array.isArray(schema)
    ? {
        '@context': 'https://schema.org',
        '@graph': schema,
      }
    : schema;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
