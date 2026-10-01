// Renders JSON-LD structured data as a native <script> tag. The `<` → `<`
// escape prevents the JSON payload from breaking out of the script element
// (XSS hardening, per the Next.js JSON-LD guide).
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
