const paths = {
    select: 'm5 3 14 9-7 1-3 7Z',
    translate: 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',
    rotate: 'M20 8a8 8 0 1 0 0 8M20 3v5h-5M12 9v6M9 12h6',
    scale: 'M4 15v5h5M20 9V4h-5M4 20l6-6M20 4l-6 6M4 4h6v6H4ZM14 14h6v6h-6Z',
    home: 'm3 11 9-8 9 8M6 9v12h12V9M10 21v-8h4v8',
    cube: 'm12 3 9 5v9l-9 5-9-5V8Zm0 10 9-5M12 13 3 8M12 13v9',
    export: 'M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6',
    settings: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
    magnet: 'M5 4v9a7 7 0 0 0 14 0V4h-4v9a3 3 0 0 1-6 0V4ZM5 8h4M15 8h4',
};

export default function ToolIcon({ name }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.cube} /></svg>;
}
