
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Gamepad2, Dices, Coins, Castle } from 'lucide-react';
import { InteractiveLudoCard } from '@/components/games/InteractiveLudoCard';

interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  imageHint: string;
}

const classicGames: GameInfo[] = [
  {
    id: 'dominoes',
    title: 'Dominoes',
    description: 'The classic tile-based game of matching numbers. Strategy and a bit of luck will see you through!',
    icon: Dices,
    imageHint: 'dominoes game',
  },
  {
    id: 'snakes-and-ladders',
    title: 'Snakes and Ladders',
    description: 'Climb the ladders and avoid the snakes in this timeless board game of chance.',
    icon: Castle,
    imageHint: 'snakes ladders boardgame',
  },
  {
    id: 'ludo',
    title: 'Ludo',
    description: 'Race your four tokens from start to finish according to die rolls. A family favourite!',
    icon: Gamepad2, // This icon will be used by InteractiveLudoCard
    imageHint: 'ludo board game',
  },
  {
    id: 'shove-hapenny',
    title: 'Shove Ha\'penny',
    description: 'A traditional pub game involving sliding coins on a marked board to score points.',
    icon: Coins,
    imageHint: 'shove ha\'penny board',
  },
];

export default function GamesPage() {
  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-4xl mb-2">Classic Games Corner</h1>
          <p className="text-muted-foreground text-lg">Relive some old favourites or discover a new classic!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classicGames.map((game) => {
            if (game.id === 'ludo') {
              return <InteractiveLudoCard key={game.id} game={game} />;
            }
            // For other games, render the original static card
            const GameIcon = game.icon || Gamepad2; // Default icon if none provided
            return (
              <Card key={game.id} className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl">
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
                    <GameIcon className="mr-2 h-5 w-5 text-primary" />
                    {game.title}
                  </CardTitle>
                  <CardDescription className="h-16 overflow-hidden">{game.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Additional game details could go here */}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" disabled>
                    Play (Coming Soon)
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
                Please note: Game implementations are illustrative. Full gameplay is not currently available for most games.
            </p>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}
