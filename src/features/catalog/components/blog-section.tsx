import { copy } from '@/content/copy'
import { ArrowRightIcon } from '@/components/icons'
import { OutOfScopeAction } from '@/components/layout/out-of-scope'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { artSrc } from '@/lib/images'

const { blog } = copy.home

export function BlogSection() {
  return (
    <section id="diario" aria-labelledby="blog-title">
      <h2 id="blog-title" className="text-center text-[28px] font-bold text-heading">
        {blog.title}
      </h2>
      <p className="mt-3 text-center text-sm text-body">{blog.subtitle}</p>
      <ul className="mx-auto mt-10 grid max-w-[1144px] grid-cols-4 gap-6">
        {blog.posts.map((post) => (
          <li key={post.title}>
            <article className="overflow-hidden rounded-card bg-surface">
              <ResponsiveImage
                src={artSrc(post.art)}
                alt=""
                width={640}
                height={640}
                sizes="268px"
                className="aspect-[268/195] w-full object-cover"
              />
              <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs/4 font-medium tracking-[-0.02em] text-body">{post.meta}</p>
                <h3 className="min-h-12 text-base font-bold text-heading">{post.title}</h3>
                <p className="text-xs/4 font-medium text-body">{post.excerpt}</p>
                <OutOfScopeAction className="inline-flex items-center gap-1 self-start text-xs font-bold text-highlight">
                  {blog.readMore}
                  <ArrowRightIcon size={14} />
                </OutOfScopeAction>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
