"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Loading() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCount((prevCount) => prevCount + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
                <div className="absolute w-28 h-28 rounded-full border-4 border-t-purple-500 border-gray-300 animate-spin"></div>
                <Image
                    src="/loading.svg"
                    alt="Loading..."
                    width={50}
                    height={50}
                    priority
                />
            </div>

            <br />
            {count > 30 && (
                <>
                    <p className="text-purple-500 text-center">
                        Está tardando un poco más de lo normal,
                    </p>
                    <p className="text-purple-500 text-center">
                        danos un momento por favor.
                    </p>
                </>

            )}
        </div>
    );
}
