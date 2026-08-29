import lionVineBlock from '../assets/lionVineBlock.svg';

type VineDividerProps = {
    className?: string;
};

export const VineDivider = ({ className = 'my-4' }: VineDividerProps) => (
    <>
        <link rel="preload" as="image" href={lionVineBlock} />
        <div className={`w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] sm:w-full sm:max-w-2xl sm:ml-0 sm:mr-0 lg:max-w-4xl flex justify-center overflow-hidden ${className}`}>
            {Array.from({ length: 15 }).map((_, i) => (
                <img key={i} src={lionVineBlock} alt="" className="h-11 w-auto -ml-1 first:ml-0" />
            ))}
        </div>
    </>
);
