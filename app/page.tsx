import { getPosts } from "@/app/actions/post";
import AIWidget from "@/app/components/AIWidget";
import { PostForm } from "@/app/components/PostForm";
import { PostList } from "@/app/components/PostList";
import { prisma } from "@/app/lib/prisma";
import { RefreshButton } from "./components/RefreshButton";

// Disable caching for this page to ensure fresh data on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // For demo purposes, we'll get or create a default user
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
      },
    });
  }

  const { posts, error } = await getPosts();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">Posts</h1>
        </div>
      </header>

      {/* MAIN SECTION */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* NEW POST FORM */}
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">
                Create a New Post
              </h2>
            </div>
            <div className="p-6">
              <PostForm user={user} />
            </div>
          </section>

          {/* AI Greeting */}
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">
                AI Greeting
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 border border-gray-300 rounded-md p-3 text-sm w-64">
                <AIWidget user={user} />
              </div>
            </div>
          </section>

          {/* POST LIST */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">All Posts</h2>
              <RefreshButton />
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
                Error loading posts: {error}
              </div>
            ) : (
              <PostList posts={posts || []} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
