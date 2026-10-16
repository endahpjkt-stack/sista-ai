<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep signed-in correspondence pages under the pathless `_authenticated` layout; its client-only gate verifies users before private queries run.
- Use one auth-state subscriber in AuthProvider for router and query invalidation; clear protected caches before signing out.
- Fill the original official DOCX XML in the browser, preserving document structure and formatting; never replace official templates with generated samples.
- Load letter lists and details through shared TanStack Query options so uploads and draft approvals invalidate the same records.
