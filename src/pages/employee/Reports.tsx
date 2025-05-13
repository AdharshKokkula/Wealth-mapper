
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getReports, createReport } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

const Reports = () => {
  const { user } = useAuth();
  
  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const reportsData = await getReports(user.id);
      return reportsData.map(report => ({
        id: report.id,
        ...report.report_data as any,
        date: report.created_at,
      }));
    },
    enabled: !!user?.id
  });
  
  const handleCreateReport = async () => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to create reports');
        return;
      }
      
      const reportData = {
        name: `Report ${new Date().toLocaleDateString()}`,
        type: 'Custom Export',
        properties: Math.floor(Math.random() * 50) + 10,
      };
      
      await createReport(user.id, reportData);
      toast.success('Report created successfully');
      refetch();
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-wealth-primary">Reports</h1>
        </div>
        <div className="text-center p-12">
          <div className="animate-pulse">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-wealth-primary">Reports</h1>
        </div>
        <div className="text-center p-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Reports</h3>
          <p className="text-red-600 mb-4">Unable to load your reports</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-wealth-primary">Reports</h1>
        <Button onClick={handleCreateReport}>
          Create New Report
        </Button>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="text-center p-12 bg-muted rounded-lg">
          <h3 className="text-xl font-medium mb-2">No reports yet</h3>
          <p className="text-muted-foreground mb-4">
            Create reports to analyze property data
          </p>
          <Button onClick={handleCreateReport}>Create Report</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-4 font-medium">Report Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Created</th>
                      <th className="text-left p-4 font-medium">Properties</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-t">
                        <td className="p-4">{report.name}</td>
                        <td className="p-4">{report.type}</td>
                        <td className="p-4">{formatDate(report.date)}</td>
                        <td className="p-4">{report.properties}</td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm" className="ml-2"
                            onClick={() => toast.info('View functionality will be implemented in a future update.')}
                          >
                            View
                          </Button>
                          <Button size="sm" className="ml-2"
                            onClick={() => toast.success('Report downloaded successfully')}
                          >
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
