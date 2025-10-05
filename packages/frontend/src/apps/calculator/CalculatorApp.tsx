import React, { useState } from 'react';
import { create, all } from 'mathjs';

const math = create(all);

const CalculatorApp: React.FC = () => {
  const [expression, setExpression] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState(0);

  const handleInput = (value: string) => {
    if (expression === '0' || expression === 'Error') {
      setExpression(value);
    } else {
      setExpression(expression + value);
    }
  };

  const handleClear = () => {
    setExpression('0');
  };

  const handleAllClear = () => {
    setExpression('0');
    setHistory([]);
    setMemory(0);
  };

  const handleEquals = () => {
    try {
      const result = math.evaluate(expression);
      setHistory([...history, `${expression} = ${result}`]);
      setExpression(String(result));
    } catch (error) {
      setExpression('Error');
    }
  };

  const handleMemory = (op: 'M+' | 'M-' | 'MR' | 'MC') => {
    const currentValue = parseFloat(expression);
    if (isNaN(currentValue)) return;

    switch (op) {
      case 'M+':
        setMemory(memory + currentValue);
        break;
      case 'M-':
        setMemory(memory - currentValue);
        break;
      case 'MR':
        setExpression(String(memory));
        break;
      case 'MC':
        setMemory(0);
        break;
    }
  };

  const Button = ({ onClick, className, children }: { onClick: () => void; className?: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`bg-neutral-800 hover:bg-neutral-700 text-white font-light text-2xl rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col bg-neutral-900 text-white font-sans rounded-lg overflow-hidden">
      <div className="flex-shrink-0 h-20 p-4 flex flex-col items-end justify-end overflow-y-auto text-neutral-400 text-lg">
        {history.slice(-2).map((item, i) => <div key={i}>{item}</div>)}
      </div>
      <div className="flex-grow p-4 flex items-end justify-end text-7xl font-thin tracking-tighter break-all">
        {expression}
      </div>
      <div className="grid grid-cols-5 gap-2 p-4 bg-neutral-900/50">
        <Button onClick={() => handleInput('(')} className="bg-neutral-700">(</Button>
        <Button onClick={() => handleInput(')')} className="bg-neutral-700">)</Button>
        <Button onClick={() => handleMemory('MC')} className="bg-neutral-700">mc</Button>
        <Button onClick={() => handleMemory('M+')} className="bg-neutral-700">m+</Button>
        <Button onClick={() => handleMemory('M-')} className="bg-neutral-700">m-</Button>

        <Button onClick={() => handleInput('7')}>7</Button>
        <Button onClick={() => handleInput('8')}>8</Button>
        <Button onClick={() => handleInput('9')}>9</Button>
        <Button onClick={() => handleInput('/')} className="bg-orange-500 text-3xl">÷</Button>
        <Button onClick={() => handleMemory('MR')} className="bg-neutral-700">mr</Button>

        <Button onClick={() => handleInput('4')}>4</Button>
        <Button onClick={() => handleInput('5')}>5</Button>
        <Button onClick={() => handleInput('6')}>6</Button>
        <Button onClick={() => handleInput('*')} className="bg-orange-500 text-3xl">×</Button>
        <Button onClick={handleAllClear} className="bg-red-500">AC</Button>

        <Button onClick={() => handleInput('1')}>1</Button>
        <Button onClick={() => handleInput('2')}>2</Button>
        <Button onClick={() => handleInput('3')}>3</Button>
        <Button onClick={() => handleInput('-')} className="bg-orange-500 text-3xl">-</Button>
        <Button onClick={handleEquals} className="bg-green-500 row-span-2 text-4xl">=</Button>

        <Button onClick={() => handleInput('0')} className="col-span-2">0</Button>
        <Button onClick={() => handleInput('.')}>.</Button>
        <Button onClick={() => handleInput('+')} className="bg-orange-500 text-3xl">+</Button>
      </div>
    </div>
  );
};

export default CalculatorApp;