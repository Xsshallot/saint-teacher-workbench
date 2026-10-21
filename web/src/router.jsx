import React from 'react';

/** 极简 hash 路由 Link（与 App.jsx 的 useHashRoute 配套） */
export function Link({ to, children, className = '' }) {
  return (
    <a href={`#${to}`} className={className}>
      {children}
    </a>
  );
}
