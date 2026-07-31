import Image from "next/image";

type BrandLockupProps = {
    inverted?: boolean;
    size?: "header" | "footer";
};

export function BrandLockup({
    inverted = false,
    size = "header",
}: BrandLockupProps) {
    const isFooter = size === "footer";

    return (
        <span className={`inline-flex items-center ${isFooter ? "gap-3.5" : "gap-2.5"}`}>
            <Image
                src={inverted
                    ? "/brand/productfindai-mark-on-dark.png"
                    : "/brand/productfindai-mark.png"}
                width={554}
                height={409}
                alt=""
                aria-hidden="true"
                priority={!inverted}
                className={isFooter
                    ? "h-12 w-auto sm:h-14"
                    : "h-8 w-auto sm:h-9"}
            />
            <span
                className={`font-display font-extrabold tracking-[-0.045em] ${
                    isFooter
                        ? "text-[25px] text-white sm:text-[29px]"
                        : "text-[19px] text-[var(--color-brand-navy)] sm:text-[21px]"
                }`}
            >
                ProductFind
                <span className={inverted
                    ? "text-[var(--color-cart-orange)]"
                    : "text-[var(--color-cart-orange-text)]"}
                >
                    AI
                </span>
            </span>
        </span>
    );
}
