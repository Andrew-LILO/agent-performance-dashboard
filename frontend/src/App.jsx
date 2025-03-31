// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DateRangePicker from './components/DateRangePicker';
import FilterableList from './components/FilterableList';
import PerformanceChart from './components/PerformanceChart';
import PerformanceTable from './components/PerformanceTable';
import LeadModal from './components/LeadModal';
import Status from './components/Status';
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

// Configure axios
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = apiBaseUrl;

// Remove trailing /api if present in the base URL for the status endpoint
const getStatusUrl = () => apiBaseUrl.replace(/\/api$/, '');

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
      const [agentsResponse, dispositionsResponse] = await Promise.all([
        axios.get('/agents'),
        axios.get('/dispositions'),
      ]);

      // Validate agents data
      const fetchedAgents = agentsResponse.data;
      console.log('Raw agents data:', fetchedAgents);
      
      if (!Array.isArray(fetchedAgents)) {
        throw new Error(`Expected an array for agents, got: ${typeof fetchedAgents}`);
      }
      
      // Validate each agent object
      const validAgents = fetchedAgents.filter(agent => {
        if (!agent || typeof agent !== 'object') {
          console.warn('Invalid agent entry:', agent);
          return false;
        }
        if (!agent.id_convoso_agent || !agent.name_convoso_agent) {
          console.warn('Agent missing required fields:', agent);
          return false;
        }
        return true;
      });

      // Validate dispositions data
      const fetchedDispositions = dispositionsResponse.data;
      console.log('Raw dispositions data:', fetchedDispositions);
      
      if (!Array.isArray(fetchedDispositions)) {
        throw new Error(`Expected an array for dispositions, got: ${typeof fetchedDispositions}`);
      }
      
      // Validate each disposition object
      const validDispositions = fetchedDispositions.filter(disposition => {
        if (!disposition || typeof disposition !== 'object') {
          console.warn('Invalid disposition entry:', disposition);
          return false;
        }
        if (!disposition.status_code_convoso || !disposition.status_name_convoso) {
          console.warn('Disposition missing required fields:', disposition);
          return false;
        }
        return true;
      });

      console.log("Valid Agents:", validAgents.length);
      console.log("Valid Dispositions:", validDispositions.length);

      setAgents(validAgents);
      setDispositions(validDispositions);

      // Select all agents by default
      setSelectedAgentIds(validAgents.map(agent => agent.id_convoso_agent));

      // Select ONLY 'QLSENT' disposition by default
      const defaultDispositionCode = 'QLSENT';
      // Check if 'QLSENT' actually exists in the fetched list
      const qlsentExists = validDispositions.some(d => d.status_code_convoso === defaultDispositionCode);
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

    // Validate date inputs
    const validateDate = (dateStr, label) => {
      console.log(`Validating ${label} date:`, dateStr);
      if (!dateStr) {
        throw new Error(`${label} date is required`);
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid ${label} date: ${dateStr}`);
      }
      return true;
    };

    try {
      // Validate dates first
      validateDate(start, 'Start');
      validateDate(end, 'End');

      // Validate date range
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (endDate < startDate) {
        throw new Error('End date cannot be before start date');
      }

      // Validate other required parameters
      if (!dispositions || !Array.isArray(dispositions) || dispositions.length === 0) {
        throw new Error('At least one disposition must be selected');
      }
      if (!agents || !Array.isArray(agents) || agents.length === 0) {
        throw new Error('At least one agent must be selected');
      }

      console.log("Fetching call log summary for:", { 
        start, 
        end, 
        dispositions: dispositions.length, 
        agents: agents.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      setIsSummaryLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: start,
        endDate: end,
        dispositionCodes: dispositions.join(','),
        agentIds: agents.join(','),
      });

      console.log('Sending request with params:', params.toString());
      console.log('Full URL:', `${axios.defaults.baseURL}/call-log-summary?${params}`);
      
      const response = await axios.get(`/call-log-summary?${params}`);
      console.log('Raw API response:', response);
      const aggregatedData = response.data;

      // Validate response data
      console.log('Raw aggregated data:', aggregatedData);
      
      if (!Array.isArray(aggregatedData)) {
        console.error('Received non-array data:', aggregatedData);
        throw new Error(`Expected an array for aggregated data, got: ${typeof aggregatedData}`);
      }

      // Validate each record in aggregated data
      const validAggregatedData = aggregatedData.filter(record => {
        if (!record || typeof record !== 'object') {
          console.warn('Invalid record:', record);
          return false;
        }
        // Required fields for both chart and table
        const requiredFields = ['id', 'name', 'total_calls', 'dispositions'];
        const missingFields = requiredFields.filter(field => !record[field]);
        if (missingFields.length > 0) {
          console.warn(`Record missing required fields: ${missingFields.join(', ')}`, record);
          return false;
        }
        // Validate total_calls is a number
        if (typeof record.total_calls !== 'number') {
          console.warn('total_calls is not a number:', record);
          return false;
        }
        // Validate dispositions is an object
        if (typeof record.dispositions !== 'object') {
          console.warn('dispositions is not an object:', record);
          return false;
        }
        return true;
      });

      console.log('Valid records after filtering:', validAggregatedData);
      console.log(`Received ${validAggregatedData.length} valid aggregated agent records.`);
      setSummaryData(validAggregatedData);
      
      // Create chart data only from valid records
      const validChartData = validAggregatedData.map(agent => ({
        id: agent.id,
        name: agent.name,
        value: agent.total_calls, // Chart expects 'value' instead of 'total_calls'
      }));
      console.log('Transformed chart data:', validChartData);
      setChartData(validChartData);

    } catch (error) {
      console.error('Error fetching call log summary:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setError(`Failed to fetch summary data: ${errorMsg}`);
      setSummaryData(null);
      setChartData(null);
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
    console.log('Row click data:', agentSummary);

    // Validate agent summary data
    if (!agentSummary || typeof agentSummary !== 'object') {
      console.error("Invalid agent summary data:", agentSummary);
      setModalError("Invalid agent data provided");
      setIsModalOpen(true);
      setIsLoadingModal(false);
      return;
    }

    if (!agentSummary.id || !agentSummary.name) {
      console.error("Agent summary missing required fields:", agentSummary);
      setModalError("Incomplete agent data");
      setIsModalOpen(true);
      setIsLoadingModal(false);
      return;
    }

    try {
      // Validate dates before proceeding
      const validateDate = (dateStr, label) => {
        if (!dateStr) throw new Error(`${label} date is required`);
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) throw new Error(`Invalid ${label} date: ${dateStr}`);
        return true;
      };

      validateDate(startDate, 'Start');
      validateDate(endDate, 'End');

      // Validate disposition codes
      if (!Array.isArray(selectedDispositionCodes) || selectedDispositionCodes.length === 0) {
        throw new Error('At least one disposition must be selected');
      }

      // Update title generation
      const dispositionText = selectedDispositionCodes.length === dispositions.length
        ? 'All Selected Dispositions'
        : selectedDispositionCodes.length === 1
        ? dispositions.find(d => d.status_code_convoso === selectedDispositionCodes[0])?.status_name_convoso || selectedDispositionCodes[0]
        : `${selectedDispositionCodes.length} Dispositions`;

      const title = `${agentSummary.name} | ${dispositionText} | ${startDate} to ${endDate}`;

      setModalTitle(title);
      setIsModalOpen(true);
      setModalData(null);
      setModalError(null);
      setIsLoadingModal(true);

      // Update params
      const params = new URLSearchParams({
        startDate,
        endDate,
        agentId: agentSummary.id,
        dispositionCodes: selectedDispositionCodes.join(','),
      });

      console.log(`Fetching details for Agent ID: ${agentSummary.id} with params:`, params.toString());
      const response = await axios.get(`/call-log-details?${params}`);
      const detailedData = response.data;

      // Validate response data
      console.log('Raw detailed data:', detailedData);

      if (!Array.isArray(detailedData)) {
        throw new Error(`Expected an array for detailed data, got: ${typeof detailedData}`);
      }

      // Validate each record in detailed data
      const validDetailedData = detailedData.filter(record => {
        if (!record || typeof record !== 'object') {
          console.warn('Invalid detail record:', record);
          return false;
        }
        // Add validation for required fields
        const requiredFields = ['call_log_id', 'call_date', 'disposition_code', 'agent_name'];
        const missingFields = requiredFields.filter(field => !record[field]);
        if (missingFields.length > 0) {
          console.warn(`Record missing required fields: ${missingFields.join(', ')}`, record);
          return false;
        }
        return true;
      });

      console.log(`Received ${validDetailedData.length} valid detailed records for modal.`);
      setModalData(validDetailedData);

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
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8">Agent Performance Dashboard</h1>
      
      {/* Date Range Picker */}
      <div className="mb-8">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Agent Filter */}
        <div className="bg-white p-4 rounded shadow">
          <FilterableList
            title="Agents"
            items={agents}
            selectedIds={selectedAgentIds}
            onToggleItem={handleAgentToggle}
            onSelectAll={handleSelectAllAgents}
            onSelectNone={handleSelectNoneAgents}
            searchTerm={agentSearchTerm}
            onSearchChange={setAgentSearchTerm}
            getItemId={item => item.id_convoso_agent}
            getItemLabel={item => item.name_convoso_agent}
            isLoading={isLoading}
          />
        </div>

        {/* Disposition Filter */}
        <div className="bg-white p-4 rounded shadow">
          <FilterableList
            title="Dispositions"
            items={dispositions}
            selectedIds={selectedDispositionCodes}
            onToggleItem={handleDispositionToggle}
            onSelectAll={handleSelectAllDispositions}
            onSelectNone={handleSelectNoneDispositions}
            searchTerm={dispoSearchTerm}
            onSearchChange={setDispoSearchTerm}
            getItemId={item => item.status_code_convoso}
            getItemLabel={item => `${item.status_code_convoso} - ${item.status_name_convoso}`}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Loading State */}
      {isSummaryLoading && (
        <div className="space-y-4 mb-8">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      )}

      {/* Results Display */}
      {!isSummaryLoading && summaryData && (
        <>
          {/* Performance Chart */}
          <div className="bg-white p-4 rounded shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Performance Chart</h2>
            <PerformanceChart data={chartData} />
          </div>

          {/* Performance Table */}
          <div className="bg-white p-4 rounded shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Performance Details</h2>
            <PerformanceTable
              data={summaryData}
              onRowClick={handleRowClick}
              selectedDispositions={selectedDispositionCodes}
            />
          </div>
        </>
      )}

      {/* Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        data={modalData}
        isLoading={isLoadingModal}
        error={modalError}
      />

      {/* Backend Status */}
      <div className="mt-8">
        <Status />
      </div>
    </div>
  );
}

export default App;