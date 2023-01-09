import { CSSProperties, useState, useRef, useEffect } from 'react'

const trnasition = 0.2;

export default function Collapsible(props: {isOpen: boolean, children: React.ReactNode}) {
  const {isOpen, children} = props;

  const [height, setHeight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    setHeight(ref.current!.clientHeight);
  });

  let parentS: CSSProperties = {
    margin: `auto`,
    maxWidth: `500px`,

    height: `0px`,
    overflow: `hidden`,
    transform: `translateY(0px)`,
    transition: `height ${trnasition}s ease-out`
  }

  let childS: CSSProperties = {
    bottom: `0px`,
    transform: `translateY(${-height}px)`,
    transition: `transform ${trnasition}s ease-out`,
  };

  if (isOpen) {
    const parentOpenS: CSSProperties = {
      height: `${height}px`,
    };
    parentS = {...parentS, ...parentOpenS,};
    const childOpenS: CSSProperties = {
      transform: `translateY(0px)`,
    };
    childS = {...childS, ...childOpenS,};
  }
  
  return (
    <div style={parentS}>
      <div style={childS} ref={ref}>
        <div style={{padding:`0.02px`}}>
          {children}
        </div>
      </div>
    </div>
  );
}