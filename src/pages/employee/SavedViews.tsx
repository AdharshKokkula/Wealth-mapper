
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getSavedViews } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SavedView {
  id: string;
  name: string;
  date: string;
  propertyCount: number;
  viewState: any;
  filters: any;
}

const SavedViews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: views, isLoading, error, refetch } = useQuery({
    queryKey: ['savedViews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const savedViewsData = await getSavedViews(user.id);
      return savedViewsData.map(view => ({
        id: view.id,
        ...view.view_data as any,
      })) as SavedView[];
    },
    enabled: !!user?.id
  });
  
  const handleLoadView = (view: SavedView) => {
    // In a real app, we'd store the view state and filters in global state
    // or context, and navigate to the map view with those parameters
    toast.success('Loading saved view...');
    navigate('/properties/map', { state: { viewState: view.viewState, filters: view.filters } });
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-wealth-primary">Saved Map Views</h1>
        </div>
        <div className="text-center p-12">
          <div className="animate-pulse">Loading saved views...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-wealth-primary">Saved Map Views</h1>
        </div>
        <div className="text-center p-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Saved Views</h3>
          <p className="text-red-600 mb-4">Unable to load your saved map views</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-wealth-primary">Saved Map Views</h1>
        <Button onClick={() => navigate('/properties/map')}>
          Create New View
        </Button>
      </div>

      {!views || views.length === 0 ? (
        <div className="text-center p-12 bg-muted rounded-lg">
          <h3 className="text-xl font-medium mb-2">No saved views yet</h3>
          <p className="text-muted-foreground mb-4">
            Save your map views to quickly access them later
          </p>
          <Button onClick={() => navigate('/properties/map')}>Go to Map</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {views.map((view) => (
            <Card key={view.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{view.name}</CardTitle>
                <CardDescription>
                  Saved on {new Date(view.date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-wealth-secondary"
                  >
                    <path d="M8 6l4-4 4 4" />
                    <path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L3.6 22" />
                    <path d="m9 18 1 1 9.9-9.9" />
                  </svg>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {view.propertyCount} properties
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" 
                      onClick={() => toast.info('Edit functionality will be implemented in a future update.')}
                    >
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleLoadView(view)}>
                      Load View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedViews;
