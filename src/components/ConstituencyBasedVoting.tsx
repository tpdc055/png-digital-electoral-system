import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import {
  User,
  MapPin,
  Users,
  Vote,
  CheckCircle,
  AlertTriangle,
  Eye,
  Lock,
  Shield,
  FileText,
  Calendar,
  Award,
  Building
} from 'lucide-react';
import { authService } from '../services/authService';

interface Candidate {
  id: string;
  name: string;
  politicalParty: string;
  photo: string;
  biography: string;
  policyPlatform: string;
  placeOfOrigin: string;
  constituency: string;
  province: string;
  age: number;
  education: string;
  experience: string;
  previousPositions: string[];
  manifesto: string;
  campaignPromises: string[];
  endorsements: string[];
  isVerified: boolean;
}

interface CitizenVoter {
  id: string;
  name: string;
  constituency: string;
  province: string;
  hasVoted: boolean;
  voteTimestamp?: Date;
  deviceLocation?: { lat: number; lng: number };
}

interface VotingRestriction {
  citizenId: string;
  allowedConstituency: string;
  restrictedConstituencies: string[];
  deviceLocked: boolean;
  pollingStationAssignment: string;
}

const ConstituencyBasedVoting: React.FC = () => {
  const [currentCitizen, setCurrentCitizen] = useState<CitizenVoter | null>(null);
  const [allowedCandidates, setAllowedCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [votingRestrictions, setVotingRestrictions] = useState<VotingRestriction | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVotingAllowed, setIsVotingAllowed] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  // Mock current user profile - In production, get from authService
  useEffect(() => {
    const mockCitizen: CitizenVoter = {
      id: 'CITIZEN-001-PNG',
      name: 'John Kila',
      constituency: 'Port Moresby South',
      province: 'National Capital District',
      hasVoted: false,
      deviceLocation: { lat: -9.4438, lng: 147.1803 }
    };

    setCurrentCitizen(mockCitizen);

    // Set voting restrictions based on citizen's registered constituency
    const restrictions: VotingRestriction = {
      citizenId: mockCitizen.id,
      allowedConstituency: mockCitizen.constituency,
      restrictedConstituencies: [
        'Port Moresby North',
        'Port Moresby Northeast',
        'Lae Open',
        'Mount Hagen Open'
      ],
      deviceLocked: false,
      pollingStationAssignment: 'Boroko Primary School'
    };

    setVotingRestrictions(restrictions);
  }, []);

  // Mock candidates data - Only candidates from citizen's constituency
  useEffect(() => {
    if (!currentCitizen) return;

    const mockCandidates: Candidate[] = [
      {
        id: 'CAND-001-PMS',
        name: 'Mary Wanma',
        politicalParty: 'Papua New Guinea Party',
        photo: 'https://same-assets.com/placeholder-woman.jpg',
        biography: 'Born and raised in Port Moresby South, Mary has served as a community leader for over 15 years. She holds a Bachelor of Law from University of Papua New Guinea and has been a strong advocate for women\'s rights and education.',
        policyPlatform: 'Education Reform, Healthcare Access, Economic Development',
        placeOfOrigin: 'Hanuabada Village, Port Moresby South',
        constituency: 'Port Moresby South',
        province: 'National Capital District',
        age: 45,
        education: 'Bachelor of Law, University of Papua New Guinea',
        experience: '15 years community leadership, 8 years legal practice',
        previousPositions: ['Community Council Chairperson', 'Legal Aid Society Director'],
        manifesto: 'Building a stronger Port Moresby South through education, healthcare, and economic opportunities for all citizens.',
        campaignPromises: [
          'Establish 3 new primary schools',
          'Build community health center',
          'Create 500 new jobs through small business support',
          'Improve road infrastructure'
        ],
        endorsements: ['Teachers Union', 'Port Moresby Chamber of Commerce', 'Women\'s Council'],
        isVerified: true
      },
      {
        id: 'CAND-002-PMS',
        name: 'Peter Namaliu',
        politicalParty: 'National Alliance Party',
        photo: 'https://same-assets.com/placeholder-man.jpg',
        biography: 'A seasoned politician with 20 years of experience. Former civil servant and community development officer. Strong focus on infrastructure and economic development for Port Moresby South.',
        policyPlatform: 'Infrastructure Development, Job Creation, Good Governance',
        placeOfOrigin: 'Kila Village, Port Moresby South',
        constituency: 'Port Moresby South',
        province: 'National Capital District',
        age: 52,
        education: 'Master of Public Administration, Australian National University',
        experience: '20 years politics, 10 years civil service',
        previousPositions: ['Deputy Governor NCD', 'Community Development Officer'],
        manifesto: 'Delivering infrastructure and opportunities that Port Moresby South deserves.',
        campaignPromises: [
          'Complete road sealing project',
          'Establish technical college',
          'Improve water and electricity supply',
          'Support small and medium enterprises'
        ],
        endorsements: ['Business Council', 'Civil Servants Association', 'Development Partners'],
        isVerified: true
      },
      {
        id: 'CAND-003-PMS',
        name: 'Elizabeth Kaupa',
        politicalParty: 'People\'s Democratic Movement',
        photo: 'https://same-assets.com/placeholder-woman-2.jpg',
        biography: 'Young, dynamic leader with background in social work and community development. Passionate about youth empowerment and environmental protection.',
        policyPlatform: 'Youth Development, Environmental Protection, Social Services',
        placeOfOrigin: 'Sabama Village, Port Moresby South',
        constituency: 'Port Moresby South',
        province: 'National Capital District',
        age: 38,
        education: 'Bachelor of Social Work, University of Papua New Guinea',
        experience: '12 years NGO work, 5 years community organizing',
        previousPositions: ['NGO Program Director', 'Youth Council President'],
        manifesto: 'Empowering youth and protecting our environment for future generations.',
        campaignPromises: [
          'Establish youth skills training center',
          'Implement waste management program',
          'Create youth employment opportunities',
          'Protect coastal areas from development'
        ],
        endorsements: ['Youth Council', 'Environmental Groups', 'Social Workers Association'],
        isVerified: true
      }
    ];

    // CRITICAL: Only show candidates from citizen's exact constituency
    const constituencyCandidates = mockCandidates.filter(
      candidate => candidate.constituency === currentCitizen.constituency
    );

    setAllowedCandidates(constituencyCandidates);
    setLocationVerified(true);
    setIsVotingAllowed(true);
  }, [currentCitizen]);

  const handleVote = async (candidateId: string) => {
    if (!currentCitizen || !isVotingAllowed || hasVoted) {
      toast.error('Voting not allowed at this time');
      return;
    }

    if (!locationVerified) {
      toast.error('Location verification required before voting');
      return;
    }

    // Verify constituency restriction
    const candidate = allowedCandidates.find(c => c.id === candidateId);
    if (!candidate || candidate.constituency !== currentCitizen.constituency) {
      toast.error('You can only vote for candidates in your registered constituency');
      return;
    }

    try {
      // Simulate vote submission with blockchain audit trail
      await new Promise(resolve => setTimeout(resolve, 2000));

      setHasVoted(true);
      setCurrentCitizen(prev => prev ? {
        ...prev,
        hasVoted: true,
        voteTimestamp: new Date()
      } : null);

      toast.success(`Vote cast successfully for ${candidate.name}. Your vote has been recorded with cryptographic verification.`);

      // Log audit trail
      console.log('AUDIT: Vote Cast', {
        citizenId: currentCitizen.id,
        candidateId,
        constituency: currentCitizen.constituency,
        timestamp: new Date(),
        deviceLocation: currentCitizen.deviceLocation,
        verificationHash: `VOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

    } catch (error) {
      toast.error('Failed to submit vote. Please try again.');
    }
  };

  const getCandidatePartyColor = (party: string) => {
    const colors = {
      'Papua New Guinea Party': 'bg-red-100 text-red-800',
      'National Alliance Party': 'bg-blue-100 text-blue-800',
      'People\'s Democratic Movement': 'bg-green-100 text-green-800'
    };
    return colors[party as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!currentCitizen) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please complete citizen registration before accessing the voting system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Voting Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-6 w-6" />
                Constituency-Based Voting System
              </CardTitle>
              <CardDescription>
                Limited Preferential Voting (LPV) for {currentCitizen.constituency}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50">
                <MapPin className="w-3 h-3 mr-1" />
                {currentCitizen.constituency}
              </Badge>
              {hasVoted ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  VOTED
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  Ready to Vote
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Geographic Restrictions Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Geographic Voting Restrictions:</strong> You can only vote for candidates registered in your constituency:
          <strong> {currentCitizen.constituency}</strong>. Cross-constituency voting is strictly prohibited for electoral integrity.
        </AlertDescription>
      </Alert>

      {/* Voter Information */}
      <Card>
        <CardHeader>
          <CardTitle>Voter Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold">Registered Voter</h4>
              <p>{currentCitizen.name}</p>
            </div>
            <div>
              <h4 className="font-semibold">Constituency</h4>
              <p>{currentCitizen.constituency}</p>
            </div>
            <div>
              <h4 className="font-semibold">Province</h4>
              <p>{currentCitizen.province}</p>
            </div>
          </div>

          {votingRestrictions && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Voting Restrictions</h4>
              <div className="text-sm space-y-1">
                <p><strong>Allowed Constituency:</strong> {votingRestrictions.allowedConstituency}</p>
                <p><strong>Polling Station:</strong> {votingRestrictions.pollingStationAssignment}</p>
                <p><strong>Device Status:</strong> {votingRestrictions.deviceLocked ? 'Locked by Admin' : 'Operational'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate List - Only from citizen's constituency */}
      <Card>
        <CardHeader>
          <CardTitle>
            Candidates for {currentCitizen.constituency} ({allowedCandidates.length} candidates)
          </CardTitle>
          <CardDescription>
            These are the only candidates you are eligible to vote for based on your registered constituency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {allowedCandidates.map((candidate, index) => (
              <Card key={candidate.id} className="border-2 hover:border-blue-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Candidate Photo */}
                    <div className="flex-shrink-0">
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                      />
                      {candidate.isVerified && (
                        <Badge className="mt-2 text-xs bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Candidate Information */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold">{candidate.name}</h3>
                          <Badge className={getCandidatePartyColor(candidate.politicalParty)}>
                            {candidate.politicalParty}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p><strong>Age:</strong> {candidate.age}</p>
                          <p><strong>Origin:</strong> {candidate.placeOfOrigin}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Education</h4>
                          <p className="text-sm text-gray-600">{candidate.education}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Experience</h4>
                          <p className="text-sm text-gray-600">{candidate.experience}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-1">Policy Platform</h4>
                        <p className="text-sm text-gray-700">{candidate.policyPlatform}</p>
                      </div>

                      <div className="flex gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{candidate.name} - Detailed Profile</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex gap-4">
                                <img
                                  src={candidate.photo}
                                  alt={candidate.name}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div>
                                  <h3 className="font-bold">{candidate.name}</h3>
                                  <p className="text-sm text-gray-600">{candidate.politicalParty}</p>
                                  <p className="text-sm">{candidate.placeOfOrigin}</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Biography</h4>
                                <p className="text-sm">{candidate.biography}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Campaign Manifesto</h4>
                                <p className="text-sm">{candidate.manifesto}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Campaign Promises</h4>
                                <ul className="text-sm space-y-1">
                                  {candidate.campaignPromises.map((promise, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      {promise}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Previous Positions</h4>
                                <ul className="text-sm space-y-1">
                                  {candidate.previousPositions.map((position, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <Award className="w-3 h-3 text-blue-500" />
                                      {position}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Endorsements</h4>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.endorsements.map((endorsement, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {endorsement}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {!hasVoted && isVotingAllowed && (
                          <Button
                            onClick={() => handleVote(candidate.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Vote className="w-4 h-4 mr-2" />
                            Vote for {candidate.name}
                          </Button>
                        )}

                        {hasVoted && (
                          <Button disabled variant="outline">
                            <Lock className="w-4 h-4 mr-2" />
                            Vote Already Cast
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voting Complete Message */}
      {hasVoted && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Vote Successfully Recorded!</strong> Your vote for {currentCitizen.constituency} has been cast and recorded with cryptographic verification.
            Voting timestamp: {currentCitizen.voteTimestamp?.toLocaleString()}.
            No changes or corrections are allowed after submission.
          </AlertDescription>
        </Alert>
      )}

      {/* Cross-Constituency Voting Prevention Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Electoral Security Measures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Cross-Constituency Voting Prevention</p>
                <p className="text-gray-600">You cannot vote in any constituency other than your registered one: {currentCitizen.constituency}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-semibold">Geographic Location Verification</p>
                <p className="text-gray-600">Your device location is verified to ensure you are voting from the correct polling area</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold">Blockchain Audit Trail</p>
                <p className="text-gray-600">All voting actions are recorded in an immutable audit log for transparency and verification</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConstituencyBasedVoting;
