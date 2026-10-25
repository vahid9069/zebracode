import type { CoverStyle } from '@/lib/types';

/** Decorative, local HTML artwork. Use <PostArtwork variant={post.cover} />; className is optional. */
export default function PostArtwork({ variant, className = '' }: { variant: CoverStyle; className?: string }) {
    return <div className={`zc-artwork zc-artwork-${variant} ${className}`} data-variant={variant} aria-hidden="true" dir="ltr">
        <div className="zc-artwork-grid" />
        <span className="zc-artwork-index">ZC / {variant.toUpperCase()}</span>
        {variant === 'json' && <div className="zc-artwork-editor"><div className="zc-editor-bar"><i /><i /><i /><span>data.json</span></div><pre><span className="zc-code-dim">{'{'}</span>{'\n'}{'  '}<span className="zc-code-blue">"idea"</span>: <span className="zc-code-green">"build better"</span>,{'\n'}{'  '}<span className="zc-code-blue">"clarity"</span>: <span className="zc-code-orange">true</span>,{'\n'}{'  '}<span className="zc-code-blue">"next"</span>: [<span className="zc-code-green">"create"</span>]{'\n'}<span className="zc-code-dim">{'}'}</span></pre><span className="zc-artwork-check">✓ JSON</span></div>}
        {variant === 'code' && <div className="zc-artwork-editor"><div className="zc-editor-bar"><i /><i /><i /><span>index.ts</span></div><pre><span className="zc-code-blue">const</span> build = (idea) =&gt; {'{'}{'\n'}{'  '}<span className="zc-code-blue">return</span> {'{'}{'\n'}{'    '}...idea,{'\n'}{'    '}ready: <span className="zc-code-orange">true</span>{'\n'}{'  };\n};'}</pre><span className="zc-artwork-check">&lt;/&gt;</span></div>}
        {variant === 'security' && <div className="zc-artwork-security"><div className="zc-security-orbit" /><div className="zc-security-shield"><svg viewBox="0 0 100 112" fill="none"><path d="M50 5 91 22v33c0 25-21 42-41 52C30 97 9 80 9 55V22L50 5Z" stroke="currentColor" strokeWidth="2" /><path d="m31 54 13 13 27-30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span className="zc-artwork-caption">•••• •••• ••••</span></div>}
        {variant === 'network' && <div className="zc-artwork-network"><span className="zc-network-node zc-network-start">GET</span><span className="zc-network-line" /><span className="zc-network-node zc-network-middle">{'{ }'}</span><span className="zc-network-line" /><span className="zc-network-node zc-network-end">200</span><span className="zc-artwork-caption">request → response</span></div>}
        {variant === 'text' && <div className="zc-artwork-text"><span className="zc-text-glyph">Aa<span>→</span>آ</span><div className="zc-text-lines"><i /><i /><i /></div><span className="zc-artwork-caption">read · understand · create</span></div>}
        {variant === 'terminal' && <div className="zc-artwork-editor"><div className="zc-editor-bar"><i /><i /><i /><span>~/workspace</span></div><pre><span className="zc-code-green">❯</span> build --with-clarity{'\n\n'}<span className="zc-code-dim">  ✓ less noise\n  ✓ more focus\n</span>{'\n'}<span className="zc-code-green">❯</span> <span className="zc-terminal-cursor">_</span></pre></div>}
        <span className="zc-artwork-corner">+</span>
    </div>;
}
