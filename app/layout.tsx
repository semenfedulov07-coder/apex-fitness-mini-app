import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'APEX — Твоя следующая версия',description:'Персональная фитнес-платформа Марка Волкова. Программы, тренировки и прогресс. Портфолио-демонстрация.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru" className="dark"><body>{children}</body></html>}
