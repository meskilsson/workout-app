
type LoadingPredatorProps = {
    className?: string;
}

export default function LoadingPredator({ className }: LoadingPredatorProps) {
    return (
        <div className={`${className ?? ""}`}></div>
    )
}