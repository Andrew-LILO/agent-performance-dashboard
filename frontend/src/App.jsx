// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DateRangePicker from './components/DateRangePicker';
import FilterableList from './components/FilterableList';
import PerformanceChart from './components/PerformanceChart';
import PerformanceTable from './components/PerformanceTable';
import LeadModal from './components/LeadModal';
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

// --- Constants ---
const defaultStartDate = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
})();
const defaultEndDate = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
})();
const adjustedEndDate = defaultEndDate < defaultStartDate ? new Date().toISOString().split('T')[0] : defaultEndDate;

function App() {
  // --- State management ---
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(adjustedEndDate);

  // Filter Data Sources
  const [agents, setAgents] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  // REMOVED campaigns state

  // Current Selections
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [selectedDispositionCodes, setSelectedDispositionCodes] = useState([]);
  // REMOVED selectedCampaignIds state

  // Search Terms for Filters
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [dispoSearchTerm, setDispoSearchTerm] = useState('');
  // REMOVED campaignSearchTerm state

  // UI State
  const [isLoading, setIsLoading] = useState(true); // For initial filter options load
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data Display State
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [modalError, setModalError] = useState(null);

  // --- Data fetching functions ---

  // Fetch initial filter options (agents, dispositions)
  const fetchInitialData = useCallback(async () => {
    console.log("Fetching initial filter data (Agents, Dispositions)...");
    setIsLoading(true);
    setError(null);
    setAgents([]); setDispositions([]); // Clear previous data
    setSelectedAgentIds([]); setSelectedDispositionCodes([]); // Clear selections initially

    try {
      // Fetch agents and dispositions concurrently
      // REMOVED campaigns fetch
      const [agentsResponse, dispositionsResponse] = await Promise.all([
        axios.get('/api/agents'),
        axios.get('/api/dispositions'),
      ]);

      const fetchedAgents = agentsResponse.data || [];
      const fetchedDispositions = dispositionsResponse.data || [];

      console.log("Fetched Agents:", fetchedAgents.length);
      console.log("Fetched Dispositions:", fetchedDispositions.length);

      setAgents(fetchedAgents);
      setDispositions(fetchedDispositions);

      // Select all agents by default
      setSelectedAgentIds(fetchedAgents.map(agent => agent.id_convoso_agent));

      // Select ONLY 'QLSENT' disposition by default
      const defaultDispositionCode = 'QLSENT';
      // Check if 'QLSENT' actually exists in the fetched list
      const qlsentExists = fetchedDispositions.some(d => d.status_code_convoso === defaultDispositionCode);
      setSelectedDispositionCodes(qlsentExists ? [defaultDispositionCode] : []);

    } catch (error) {
      console.error('Error fetching initial filter data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setError(`Failed to load initial filter data: ${errorMsg}. Please check backend connection and refresh.`);
      setAgents([]); setDispositions([]);
      setSelectedAgentIds([]); setSelectedDispositionCodes([]);
    } finally {
      setIsLoading(false);
      console.log("Initial filter data fetch complete.");
    }
  }, []);

  // Fetch aggregated call log summary
  const fetchCallLogSummary = useCallback(async (currentFilters) => {
    // Removed campaigns from destructuring
    const { start, end, dispositions, agents } = currentFilters;

    if (!start || !end || !dispositions || dispositions.length === 0 || !agents || agents.length === 0) {
       console.log("Skipping summary fetch due to missing required filters (Date, Agents, Dispositions):", currentFilters);
       setSummaryData(null); setChartData(null); setError(null);
       return;
    }

    // Removed campaigns from log
    console.log("Fetching call log summary for:", { start, end, dispositions: dispositions.length, agents: agents.length });
    setIsSummaryLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: start,
        endDate: end,
        dispositionCodes: dispositions.join(','),
        agentIds: agents.join(','),
        // REMOVED campaignIds parameter
      });

      const response = await axios.get(`/api/call-log-summary?${params}`);
      const aggregatedData = response.data || [];
      console.log(`Received ${aggregatedData.length} aggregated agent records.`);
      setSummaryData(aggregatedData);
      setChartData(aggregatedData.map(agent => ({
        id: agent.id, name: agent.name, value: agent.total_calls,
      })));

    } catch (error) {
      console.error('Error fetching call log summary:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setError(`Failed to fetch summary data: ${errorMsg}`);
      setSummaryData(null); setChartData(null);
    } finally {
      console.log("Setting summary loading FALSE");
      setIsSummaryLoading(false);
    }
  }, []); // Empty dependency array

  // --- Effects ---

  // Fetch initial filter options on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]); // fetchInitialData is stable

  // Fetch summary data when relevant filters change
  const selectedDispositionsString = JSON.stringify([...selectedDispositionCodes].sort());
  const selectedAgentsString = JSON.stringify([...selectedAgentIds].sort());
  // REMOVED selectedCampaignsString

  useEffect(() => {
    if (!isLoading) {
        const currentSelectedAgents = JSON.parse(selectedAgentsString);
        const currentSelectedDispositions = JSON.parse(selectedDispositionsString);
        // REMOVED currentSelectedCampaigns

        if (currentSelectedDispositions.length > 0 && currentSelectedAgents.length > 0) {
            fetchCallLogSummary({
                start: startDate,
                end: endDate,
                dispositions: currentSelectedDispositions,
                agents: currentSelectedAgents,
                // REMOVED campaigns property
            });
        } else {
             setSummaryData(null); setChartData(null); setError(null);
             console.log("Required filters (agents/dispositions) not selected. Clearing summary data.");
        }
    }
    // Dependencies updated
  }, [
      startDate,
      endDate,
      selectedDispositionsString,
      selectedAgentsString,
      // REMOVED selectedCampaignsString
      isLoading,
      fetchCallLogSummary
  ]);


  // --- Event handlers ---
  const handleAgentToggle = useCallback((agentId) => { setSelectedAgentIds(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]); }, []);
  const handleSelectAllAgents = useCallback(() => { setSelectedAgentIds(agents.map(a => a.id_convoso_agent)); }, [agents]);
  const handleSelectNoneAgents = useCallback(() => { setSelectedAgentIds([]); }, []);
  const handleDispositionToggle = useCallback((dispositionCode) => { setSelectedDispositionCodes(prev => prev.includes(dispositionCode) ? prev.filter(code => code !== dispositionCode) : [...prev, dispositionCode]); }, []);
  const handleSelectAllDispositions = useCallback(() => { setSelectedDispositionCodes(dispositions.map(d => d.status_code_convoso)); }, [dispositions]);
  const handleSelectNoneDispositions = useCallback(() => { setSelectedDispositionCodes([]); }, []);
  // REMOVED Campaign Handlers

  const closeModal = useCallback(() => { setIsModalOpen(false); setModalData(null); setModalError(null); setModalTitle(''); }, []);

  // Handle Row Click for Modal
  const handleRowClick = async (agentSummary) => {
    if (!agentSummary || !agentSummary.id) {
        console.error("Invalid agent data passed to handleRowClick");
        setModalError("Invalid agent data provided.");
        setIsModalOpen(true);
        setIsLoadingModal(false);
        return;
    }

    // Update title generation - REMOVED campaignText
    const dispositionText = selectedDispositionCodes.length === dispositions.length
        ? 'All Selected Dispositions'
        : selectedDispositionCodes.length === 1
        ? dispositions.find(d => d.status_code_convoso === selectedDispositionCodes[0])?.status_name_convoso || selectedDispositionCodes[0]
        : `${selectedDispositionCodes.length} Dispositions`;

    const title = `${agentSummary.name} | ${dispositionText} | ${startDate} to ${endDate}`; // Simplified title

    setModalTitle(title);
    setIsModalOpen(true);
    setModalData(null); setModalError(null); setIsLoadingModal(true);

    try {
      // Update params - REMOVED campaignIds
      const params = new URLSearchParams({
        startDate,
        endDate,
        agentId: agentSummary.id,
        dispositionCodes: selectedDispositionCodes.join(','),
      });

      console.log(`Fetching details for Agent ID: ${agentSummary.id} with params:`, params.toString());
      const response = await axios.get(`/api/call-log-details?${params}`);
      const detailedData = response.data || [];
      console.log(`Received ${detailedData.length} detailed records for modal.`);
      setModalData(detailedData);

    } catch (error) {
      console.error('Error fetching detailed call log/lead data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setModalError(`Failed to fetch details: ${errorMsg}`);
      setModalData(null);
    } finally {
      setIsLoadingModal(false);
    }
  };


  // --- Render Logic ---
  if (isLoading) {
     return (
       <div className="flex justify-center items-center min-h-screen bg-gray-50">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
         <span className="ml-3 text-gray-600">Loading Filters...</span>
       </div>
     );
   }

   return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-[3200px] mx-auto">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Agent Call Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor agent activity, disposition statistics, and lead details.</p>
        </header>

        {/* Error Display Area */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Responsive Filters Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Date Range Picker */}
          <div className="lg:col-span-1">
            <DateRangePicker
              startDate={startDate} endDate={endDate}
              onStartDateChange={setStartDate} onEndDateChange={setEndDate}
            />
          </div>
          
          {/* Agent Filter */}
          <div className="lg:col-span-1">
            <FilterableList
              title="Agents" items={agents} selectedIds={selectedAgentIds}
              onToggleItem={handleAgentToggle} onSelectAll={handleSelectAllAgents} onSelectNone={handleSelectNoneAgents}
              searchTerm={agentSearchTerm} onSearchChange={setAgentSearchTerm}
              getItemId={item => item.id_convoso_agent} getItemLabel={item => item.name_convoso_agent}
              placeholder="Search Agents..."
            />
          </div>
          
          {/* Disposition Filter */}
          <div className="lg:col-span-1 xl:col-span-2">
            <FilterableList
              title="Dispositions" items={dispositions} selectedIds={selectedDispositionCodes}
              onToggleItem={handleDispositionToggle} onSelectAll={handleSelectAllDispositions} onSelectNone={handleSelectNoneDispositions}
              searchTerm={dispoSearchTerm} onSearchChange={setDispoSearchTerm}
              getItemId={item => item.status_code_convoso} getItemLabel={item => `${item.status_name_convoso} (${item.status_code_convoso})`}
              placeholder="Search Dispositions..."
            />
          </div>
        </div>

        {/* Loading Indicator for Summary Data */}
        {isSummaryLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-[400px] w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        )}

        {/* Results Display Area */}
        {!isSummaryLoading && !error && (
          <>
            {summaryData && summaryData.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                <div className="w-full">
                  <PerformanceChart data={chartData} />
                </div>
                <div className="w-full">
                  <PerformanceTable data={summaryData} onRowClick={handleRowClick} />
                </div>
              </div>
            ) : (
              !isLoading && (selectedAgentIds.length > 0 && selectedDispositionCodes.length > 0) && (
                <div className="bg-background p-10 rounded-lg shadow border text-center">
                  <p className="text-muted-foreground">No call data found matching the selected filters.</p>
                </div>
              )
            )}
          </>
        )}

        {/* Modal */}
        <LeadModal
          isOpen={isModalOpen} onClose={closeModal} title={modalTitle}
          data={modalData} isLoading={isLoadingModal} error={modalError}
        />
      </div>
    </div>
  );
}

export default App;