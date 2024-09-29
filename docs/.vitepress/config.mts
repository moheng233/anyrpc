import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "AnyRPC Docs",
    description: "AnyRPC",
    base: "anyrpc",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'ReadME', link: '/api/index.md' },
            { text: 'API', link: '/api/modules' }
        ],

        sidebar: [
            {
                text: 'ReadME',
                link: '/api/index.md'
            },
            {
                text: 'API',
                items: typedocSidebar,
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
        ]
    }
})
