This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Install Dependencies

```bash
bun install
```

### Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## File Structure

```
saanvi/
├── app/
│   ├── actions/           # Server actions
│   │   ├── post.ts
│   │   └── sql.ts
│   ├── components/        # React components
│   │   ├── AIWidget.tsx
│   │   ├── PostForm.tsx
│   │   ├── PostList.tsx
│   │   └── RefreshButton.tsx
│   ├── lib/              # Utility libraries
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── prisma/
│   ├── migrations/       # Database migrations
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```
