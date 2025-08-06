declare module '*.svg' {
    import React = require('react');
    const content: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;
    export default content;
}