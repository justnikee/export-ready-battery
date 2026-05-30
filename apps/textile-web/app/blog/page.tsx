import Link from "next/link";
import { getPosts } from "@/app/actions/blog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";

// Fetch posts at request time to avoid build-time DB permission errors
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The AnvayaLabs Blog | Textile Passport & Compliance Insights",
  description:
    "Latest news, updates, and expert insights on textile regulation, compliance, and sustainability.",
};

export default async function BlogIndexPage() {
  const posts = await getPosts({ status: "published" });

  return (
    <div className="container py-12 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          AnvayaLabs Insights
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay ahead of textile regulations. Expert analysis on EU ESPR, India
          QCO, and global compliance standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
              <Card className="h-full flex flex-col hover:shadow-none transition-shadow duration-200 border-border/60">
                {post.cover_image && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted relative">
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex gap-2 mb-2">
                    {post.category && (
                      <Badge variant="secondary">{post.category}</Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {post.excerpt || "No summary available."}
                  </p>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground flex justify-between items-center border-t py-4 bg-muted/20">
                  <span>
                    {post.published_at
                      ? format(new Date(post.published_at), "MMM d, yyyy")
                      : ""}
                  </span>
                  <span className="flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Read <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20">
            <p className="text-muted-foreground">
              No posts published yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
