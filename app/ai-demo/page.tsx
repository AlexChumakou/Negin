import AIGreeting from "@/app/components/AIGreeting";

export default function AIDemo() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">AI Demo</h1>
      <div className="max-w-md">
        <AIGreeting />
      </div>
    </div>
  );
}
