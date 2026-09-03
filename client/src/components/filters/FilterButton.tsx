import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import helmet from "@/assets/helmet.svg"

type FilterButtonProps = {
    name: string;
    isOpen: boolean;
    clickAction: () => void;
    onClose: () => void;
    align?: 'center' | 'top';
    info?: React.ReactNode;
    children?: React.ReactNode;
    buttonClassName?: string;
    topOffsetClass?: string;
};

export const FilterButton = ({name, isOpen, clickAction, onClose, info, align, children, buttonClassName, topOffsetClass}: FilterButtonProps) => {
    return (
        <div className="flex flex-col items-center">
            <div className="group relative flex items-center w-fit mx-auto">
                <img src={helmet} alt="" className="absolute right-full mr-0.5 h-6 w-auto -scale-x-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Button onClick={clickAction} className={buttonClassName}>{name}</Button>
                <img src={helmet} alt="" className="absolute left-full ml-0.5 h-6 w-auto opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
                {info}
            <Modal isOpen= {isOpen} onClose= {onClose} align={align} topOffsetClass={topOffsetClass} label={name} wide>
                {children}
                </Modal>
        </div>
    );
}