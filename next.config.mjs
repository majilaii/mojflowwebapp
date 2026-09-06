/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/mojflow/index.html", destination: "/", permanent: true },
      { source: "/mojflow/privacy.html", destination: "/privacy", permanent: true },
      { source: "/mojflow/ai-resenja.html", destination: "/ai-resenja", permanent: true },
      { source: "/mojflow/ai-automatizacija.html", destination: "/ai-automatizacija", permanent: true },
      { source: "/mojflow/blog.html", destination: "/blog", permanent: true },
      { source: "/mojflow/blog-ai-pocetak.html", destination: "/blog/kako-poceti-sa-ai-automatizacijom", permanent: true },
      { source: "/mojflow/blog-kalkula.html", destination: "/blog/ai-obrada-faktura-kalkula", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.:ext",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
