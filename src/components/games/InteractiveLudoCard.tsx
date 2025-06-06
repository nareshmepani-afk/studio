
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Gamepad2 } from 'lucide-react'; // Ensure Gamepad2 is imported if used as icon

// Define GameInfo locally or import if it's made available globally
interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType; // e.g., LucideIcon
  imageHint: string;
}

interface InteractiveLudoCardProps {
  game: GameInfo;
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export function InteractiveLudoCard({ game }: InteractiveLudoCardProps) {
  const [diceValue, setDiceValue] = useState<number | null>(null);

  const handleRollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
  };

  const CurrentDiceIcon = diceValue ? diceIcons[diceValue - 1] : null;
  const LudoIcon = game.icon || Gamepad2; // Fallback to Gamepad2 if no icon provided

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl">
      <div className="relative w-full h-48 bg-muted">
        <Image
          src={`https://placehold.co/400x300.png`}
          alt={game.title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={game.imageHint}
        />
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <LudoIcon className="mr-2 h-5 w-5 text-primary" />
          {game.title}
        </CardTitle>
        <CardDescription className="h-16 overflow-hidden">{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {CurrentDiceIcon && (
          <div className="flex flex-col items-center justify-center my-2">
            <p className="text-sm text-muted-foreground mb-1">You rolled:</p>
            <CurrentDiceIcon className="h-12 w-12 text-primary" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-center space-y-2">
        <Button className="w-full" onClick={handleRollDice}>
          Roll Dice
        </Button>
      </CardFooter>
    </Card>
  );
}
