import s from './Loading.module.scss'

interface LoadingProps {
    status?: string;
}

export const Loading = ({ status }: LoadingProps) => {
    return (
        <div className={s.container}>
            <div className={s.loader}>
                <img 
                    src="https://i.postimg.cc/J7YW7szC/Comp-9-2025-08-23-03-08-37.png" 
                    alt="Logo" 
                    className={s.logo}
                />
                {status && (
                    <p className={s.status}>{status}</p>
                )}
            </div>
        </div>
    )
}