// src/components/LeadModal.jsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, ExternalLink, Phone, Mail, User, Building, Calendar, List, 
  Tag, FileText, DollarSign, Hash, Info, Clock, MessageSquare, 
  PlayCircle, Briefcase, Edit, HelpCircle, AlertCircle, Calendar as CalendarIcon,
  Clock as ClockIcon, MapPin
} from 'lucide-react';

// Preserve your existing helper functions
const formatSeconds = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return 'N/A';
  const totalSeconds = Number(seconds);
  if (totalSeconds < 0) return 'N/A';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const hStr = String(h).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');
  return h > 0 ? `${hStr}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
};

const formatDate = (dateString) => {
  if (!dateString || dateString === '0000-00-00 00:00:00') return 'N/A';
  try {
    const date = new Date(dateString.includes(' ') ? dateString.replace(' ', 'T') + 'Z' : dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  } catch (e) {
    console.warn("Date formatting failed for:", dateString, e);
    return dateString;
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(value)) return 'N/A';
  try {
    return parseFloat(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  } catch (e) {
    return value;
  }
};

// DetailItem Component
const DetailItem = ({ label, value, icon: Icon = Info, isLink = false, isLongText = false, linkPrefix = '' }) => (
  <div className="py-2 grid grid-cols-3 gap-x-2 items-start border-b border-border last:border-b-0">
    <dt className="text-sm font-medium text-muted-foreground flex items-center col-span-1 truncate" title={label}>
      {Icon && <Icon size={14} className="mr-1.5 text-muted-foreground flex-shrink-0" />}
      {label}
    </dt>
    <dd className={`text-sm text-foreground col-span-2 ${isLongText ? 'whitespace-pre-wrap' : 'break-words'}`}>
      {value === null || value === undefined || value === '' ? (
        <span className="text-muted-foreground italic">N/A</span>
      ) : isLink ? (
        <a href={`${linkPrefix}${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center text-xs break-all">
          <span>{isLink === true ? "View/Listen" : isLink}</span>
          <ExternalLink size={12} className="ml-1" />
        </a>
      ) : (
        String(value)
      )}
    </dd>
  </div>
);

function LeadModal({ isOpen, onClose, title, data, isLoading, error }) {
  const customFieldLabels = {
    // Basic Information
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    email_2: "Email #2",
    company_name: "Company Name",
    primary_phone: "Primary Phone",
    
    // Business Details
    monthly_revenue: "Monthly Revenue (Estimated)",
    requested_funding: "Request Funding Amount",
    credit_score: "Credit Score",
    business_start_date: "Business Start Date",
    open_positions: "Number of Open Positions",
    main_industry: "Main Industry",
    company_desc_primary: "Company Description (Primary)",
    
    // Additional Details
    timeline: "Timeline | Urgency",
    use_of_funds: "Use of Funds",
    liens: "Liens | Judgements | Prior Defaults",
    off_the_wall_q: "Off The Wall Question",
    off_the_wall_answer: "Off The Wall Question Answer",
    
    // Notes & Reasons
    notes: "Notes",
    ni_reasons: "Not Interested Reasons",
    bad_lead_reason: "Bad MCA Lead Reason",
    
    // Location
    state: "State"
  };

  const getConvosoLeadLink = (leadId) => {
    return leadId && leadId !== 'N/A' ? `https://admin.convoso.com/leads/edit_lead.php?lead_id=${leadId}` : null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden">
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              Error loading details: {error}
            </div>
          )}
          
          {!isLoading && !error && (!data || data.length === 0) && (
            <div className="text-center p-8 text-muted-foreground">
              No details found for the selected criteria.
            </div>
          )}
          
          {!isLoading && !error && data && data.length > 0 && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-4">
                {data.map((item, index) => (
                  <div key={item.call_log_id || `item-${index}`} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b flex justify-between items-center flex-wrap gap-2">
                      <h4 className="text-md font-semibold">
                        Call on {formatDate(item.call_date)} by {item.agent_name} (Log: {item.call_log_id})
                      </h4>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Lead: {item.first_name} {item.last_name} ({item.lead_id})</span>
                        {getConvosoLeadLink(item.lead_id) && (
                          <a href={getConvosoLeadLink(item.lead_id)} target="_blank" rel="noopener noreferrer" title="View Lead in Convoso" className="text-primary">
                            <Edit size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <Tabs defaultValue="lead" className="px-4 py-4">
                      <TabsList className="mb-4">
                        <TabsTrigger value="lead">Lead Info</TabsTrigger>
                        <TabsTrigger value="business">Business Details</TabsTrigger>
                        <TabsTrigger value="additional">Additional Info</TabsTrigger>
                        <TabsTrigger value="call">Call Info</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="lead">
                        <div className="space-y-1">
                          <DetailItem label="First Name" value={item.first_name} icon={User} />
                          <DetailItem label="Last Name" value={item.last_name} icon={User} />
                          <DetailItem label="Email" value={item.email} icon={Mail} />
                          <DetailItem label="Email #2" value={item.email_2} icon={Mail} />
                          <DetailItem label="Company Name" value={item.company_name} icon={Building} />
                          <DetailItem label="Primary Phone" value={item.phone_number} icon={Phone} />
                          <DetailItem label="State" value={item.state} icon={MapPin} />
                        </div>
                      </TabsContent>

                      <TabsContent value="business">
                        <div className="space-y-1">
                          <DetailItem label="Monthly Revenue (Estimated)" value={formatCurrency(item.monthly_revenue)} icon={DollarSign} />
                          <DetailItem label="Request Funding Amount" value={formatCurrency(item.requested_funding)} icon={DollarSign} />
                          <DetailItem label="Credit Score" value={item.credit_score} icon={Hash} />
                          <DetailItem label="Business Start Date" value={item.business_start_date} icon={CalendarIcon} />
                          <DetailItem label="Number of Open Positions" value={item.open_positions} icon={User} />
                          <DetailItem label="Main Industry" value={item.main_industry} icon={Briefcase} />
                          <DetailItem label="Company Description (Primary)" value={item.company_desc_primary} icon={FileText} isLongText={true} />
                        </div>
                      </TabsContent>

                      <TabsContent value="additional">
                        <div className="space-y-1">
                          <DetailItem label="Timeline | Urgency" value={item.timeline} icon={ClockIcon} />
                          <DetailItem label="Use of Funds" value={item.use_of_funds} icon={DollarSign} isLongText={true} />
                          <DetailItem label="Liens | Judgements | Prior Defaults" value={item.liens} icon={AlertCircle} />
                          <DetailItem label="Off The Wall Question" value={item.off_the_wall_q} icon={HelpCircle} />
                          <DetailItem label="Off The Wall Question Answer" value={item.off_the_wall_answer} icon={MessageSquare} />
                          <DetailItem label="Notes" value={item.notes} icon={FileText} isLongText={true} />
                          <DetailItem label="Not Interested Reasons" value={item.ni_reasons} icon={AlertCircle} />
                          <DetailItem label="Bad MCA Lead Reason" value={item.bad_lead_reason} icon={AlertCircle} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="call">
                        <div className="space-y-1">
                          <DetailItem label="Disposition" value={`${item.disposition_name} (${item.disposition_code})`} icon={Tag}/>
                          <DetailItem label="Call Length" value={formatSeconds(item.call_length)} icon={Clock}/>
                          <DetailItem label="Call Type" value={item.call_type} icon={Phone}/>
                          <DetailItem label="Number Dialed" value={item.number_dialed} icon={Hash}/>
                          <DetailItem label="Recording" value={item.recording_url} icon={PlayCircle} isLink={item.recording_url ? "Listen" : false}/>
                          <DetailItem label="Agent Comment" value={item.agent_comment} icon={MessageSquare} isLongText={true}/>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LeadModal;