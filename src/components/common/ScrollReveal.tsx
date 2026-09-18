import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
    children: React.ReactNode;
    animation?: "fade-in" | "slide-up" | "scale-in";
    delay?: number;
    className?: string;
}

const ScrollReveal = ({
    children,
    animation = "slide-up",
    delay = 0,
    className = ""
}: ScrollRevealProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% is visible
        });

        const currentRef = domRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    const animationClass = `animate-${animation}`;

    return (
        <div
            ref={domRef}
            className={`${className} ${isVisible ? animationClass : "opacity-0"}`}
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: "forwards"
            }}
        >
            {children}
        </div>
    );
};

export default ScrollReveal;
