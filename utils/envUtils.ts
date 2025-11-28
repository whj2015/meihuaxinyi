
/**
 * 获取环境变量的通用方法
 * 兼容 Vite (import.meta.env), Cloudflare Workers/Pages (运行时注入), 以及 Node process.env
 */
export const getEnvVar = (key: string): string | undefined => {
  // 1. 检查运行时注入的全局变量 (Cloudflare Workers HTMLRewriter 注入或 Docker 注入)
  // 这种方式允许在不重新构建的情况下修改 Key
  if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV[key]) {
    return (window as any).ENV[key];
  }

  // 2. 检查 Vite / ES Modules 标准
  // 优先匹配不带 VITE_ 前缀的 (Cloudflare Pages 环境变量通常直接通过 process.env 或 import.meta.env 暴露)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env[key]) return import.meta.env[key];
    // @ts-ignore
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  }

  // 3. 检查 Node.js / Webpack / Cloudflare build time env
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
  }

  return undefined;
};
