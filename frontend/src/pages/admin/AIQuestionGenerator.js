// src/pages/admin/AIQuestionGenerator.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Brain, 
  Activity, 
  Sparkles, 
  Layers, 
  Zap, 
  BookOpen, 
  FileText, 
  FolderOpen, 
  Clock, 
  Award,
  Calendar,
  Shield,
  Users,
  Database,
  Cpu,
  Globe,
  Target,
  Search,
  BarChart3,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Code,
  Save,
  Download,
  Plus,
  Eye,
  Upload,
  Trash2
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const AIQuestionGenerator = () => {
  const [mode, setMode] = useState('partial'); // 'partial' or 'full'
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedSources, setSelectedSources] = useState(['leetcode', 'codeforces']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [generationStats, setGenerationStats] = useState(null);
  const [savedCollections, setSavedCollections] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [currentCollection, setCurrentCollection] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  
  // Exam configuration for Full Mode
  const [examConfig, setExamConfig] = useState({
    name: '',
    subject: '',
    dateTime: '',
    duration: 60,
    passingMarks: 40,
    totalMarks: 100,
    isProctored: true,
    maxViolations: 3,
    instructions: ''
  });
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(null);
  const currentGenerationRef = useRef(null);
  
  const navigate = useNavigate();

  // Load students on component mount
  useEffect(() => {
    adminAPI.getStudents({ limit: 500 }).then(res => setAllStudents(res.data.students || [])).catch(() => {});
  }, []);

  const sources = [
    { id: 'leetcode', name: 'LeetCode', icon: Database, color: '#ffa116', description: 'Algorithm & data structure questions' },
    { id: 'codeforces', name: 'Codeforces', icon: Cpu, color: '#1f8e3f', description: 'Competitive programming problems' },
    { id: 'geeksforgeeks', name: 'GeeksforGeeks', icon: Globe, color: '#2f8d46', description: 'Interview preparation questions' },
    { id: 'hackerrank', name: 'HackerRank', icon: Target, color: '#00a86b', description: 'Coding challenges & assessments' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: '#22c55e', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: '#f59e0b', icon: '🟡' },
    { value: 'hard', label: 'Hard', color: '#ef4444', icon: '🔴' }
  ];

  const toggleSource = (sourceId) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const generateQuestions = async () => {
    if (selectedSources.length === 0) {
      toast.error('Please select at least one source');
      return;
    }

    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (!difficulty) {
      toast.error('Please select a difficulty level');
      return;
    }

    // Create unique generation ID
    const generationId = Date.now().toString();
    setCurrentGeneration(generationId);
    currentGenerationRef.current = generationId; // Set ref immediately
    setIsGenerating(true);
    
    console.log('Starting question generation:', generationId);

    try {
      const targetQuestionCount = parseInt(questionCount);
      const stats = {
        total: 0,
        bySource: {},
        byDifficulty: {}
      };
      const allQuestions = [];
      let remainingQuestions = targetQuestionCount;

      // Distribute questions evenly across sources
      const questionsPerSource = Math.ceil(targetQuestionCount / selectedSources.length);

      for (let i = 0; i < selectedSources.length; i++) {
        // Check if this generation is still valid (using ref for immediate check)
        if (currentGenerationRef.current !== generationId) {
          console.log('Generation cancelled - newer generation started:', generationId);
          return;
        }

        const source = selectedSources[i];
        const countForThisSource = i === selectedSources.length - 1 ? remainingQuestions : Math.min(questionsPerSource, remainingQuestions);
        
        const questions = await fetchQuestionsFromSource(source, topic, difficulty, countForThisSource);
        allQuestions.push(...questions);
        stats.bySource[source] = questions.length;
        stats.total += questions.length;
        remainingQuestions -= questions.length;
        
        questions.forEach(q => {
          stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
        });
        
        if (remainingQuestions <= 0) break;
      }

      // Check if this generation is still valid (using ref for immediate check)
      if (currentGenerationRef.current !== generationId) {
        console.log('Generation cancelled - newer generation started:', generationId);
        return;
      }

      // Process and transform questions
      const processedQuestions = allQuestions.map((q, index) => {
        const transformedQuestion = {
          id: `ai_${Date.now()}_${index}`,
          type: 'coding',
          questionText: q.description || q.title, // Backward compatibility
          question_text: q.description || q.title, // Student view compatibility
          title: q.title,
          description: q.description || q.title, // Admin preview compatibility
          marks: q.difficulty === 'easy' ? 5 : q.difficulty === 'medium' ? 10 : 15,
          difficulty: q.difficulty,
          source: sources.find(s => s.id === q.source),
          tags: q.tags || [],
          timeComplexity: q.timeComplexity,
          spaceComplexity: q.spaceComplexity,
          examples: q.examples || [], // Backward compatibility
          testCases: q.examples || [], // Student view compatibility
          constraints: q.constraints || [],
          solution: q.solution,
          generatedAt: new Date().toISOString(),
          randomSeed: Math.random()
        };
        return transformedQuestion;
      });

      // Shuffle and ensure exact count
      const shuffled = processedQuestions.sort(() => Math.random() - 0.5);
      const finalQuestions = shuffled.slice(0, targetQuestionCount);
      
      setGeneratedQuestions(finalQuestions);
      setGenerationStats(stats);
      
      if (mode === 'full') {
        // In full mode, automatically select all questions and create exam
        setSelectedQuestions(finalQuestions);
        toast.success(`Generated ${finalQuestions.length} questions automatically!`);
        
        console.log('Auto-creating exam with', finalQuestions.length, 'questions for generation', generationId);
        
        // Auto-create exam if configuration is valid
        if (examConfig.name && examConfig.dateTime && selectedStudents.length > 0) {
          // Check if this generation is still valid before creating exam (using ref)
          if (currentGenerationRef.current === generationId) {
            setTimeout(() => createExamWithQuestions(finalQuestions, generationId), 1000);
          } else {
            console.log('Skipping exam creation - newer generation in progress');
          }
        } else {
          toast.error('Please complete exam configuration and select students');
        }
      } else {
        toast.success(`Generated ${finalQuestions.length} questions for review`);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      // Only clear generation state if this is still the current generation (using ref)
      if (currentGenerationRef.current === generationId) {
        setIsGenerating(false);
      }
    }
  };

  const fetchQuestionsFromSource = async (source, topic, difficulty, count) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Comprehensive question database for production-level generation
    const questionDatabase = {
      leetcode: {
        easy: [
          {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            tags: ["array", "hash-table"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "[2,7,11,15], target=9", output: "[0,1]" }],
            constraints: ["2 <= nums.length <= 10^4"],
            solution: "Use a hash map to store complement values"
          },
          {
            title: "Palindrome Number",
            description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
            tags: ["math", "two-pointers"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "121", output: "true" }],
            constraints: ["-2^31 <= x <= 2^31 - 1"],
            solution: "Reverse half of the number and compare"
          },
          {
            title: "Roman to Integer",
            description: "Given a roman numeral, convert it to an integer.",
            tags: ["hash-table", "math"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "III", output: "3" }],
            constraints: ["1 <= s.length <= 15"],
            solution: "Map symbols to values and process from left to right"
          },
          {
            title: "Longest Common Prefix",
            description: "Find the longest common prefix string amongst an array of strings.",
            tags: ["string", "trie"],
            timeComplexity: "O(S)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[\"flower\",\"flow\",\"flight\"]", output: "\"fl\"" }],
            constraints: ["1 <= strs.length <= 200"],
            solution: "Compare characters vertically across all strings"
          },
          {
            title: "Valid Parentheses",
            description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            tags: ["stack", "string"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "()[]{}", output: "true" }],
            constraints: ["1 <= s.length <= 10^4"],
            solution: "Use stack to track opening brackets"
          },
          {
            title: "Merge Two Sorted Lists",
            description: "Merge two sorted linked lists and return it as a sorted list.",
            tags: ["linked-list", "recursion"],
            timeComplexity: "O(n + m)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,4], [1,3,4]", output: "[1,1,2,3,4,4]" }],
            constraints: ["Number of nodes <= 50"],
            solution: "Iteratively merge by comparing nodes"
          },
          {
            title: "Remove Duplicates from Sorted Array",
            description: "Remove duplicates from a sorted array in-place and return the new length.",
            tags: ["array", "two-pointers"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,1,2]", output: "2, [1,2]" }],
            constraints: ["1 <= nums.length <= 3 * 10^4"],
            solution: "Use two-pointer technique to overwrite duplicates"
          },
          {
            title: "Remove Element",
            description: "Given an array nums and a value val, remove all instances of val in-place and return the new length.",
            tags: ["array", "two-pointers"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[3,2,2,3], val=3", output: "2, [2,2]" }],
            constraints: ["0 <= nums.length <= 100"],
            solution: "Use two-pointer approach to skip unwanted elements"
          },
          {
            title: "Search Insert Position",
            description: "Given a sorted array and a target value, return the index if the target is found.",
            tags: ["array", "binary-search"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,3,5,6], target=5", output: "2" }],
            constraints: ["1 <= nums.length <= 10^4"],
            solution: "Binary search to find insertion point"
          },
          {
            title: "Length of Last Word",
            description: "Given a string s, return the length of the last word in the string.",
            tags: ["string"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "Hello World", output: "5" }],
            constraints: ["1 <= s.length <= 10^4"],
            solution: "Traverse from end and count characters"
          },
          {
            title: "Plus One",
            description: "Given a non-empty array of decimal digits representing a non-negative integer, increment the integer by one.",
            tags: ["array", "math"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3]", output: "[1,2,4]" }],
            constraints: ["1 <= digits.length <= 100"],
            solution: "Handle carry from rightmost digit"
          },
          {
            title: "Add Binary",
            description: "Given two binary strings a and b, return their sum as a binary string.",
            tags: ["math", "string", "bit-manipulation"],
            timeComplexity: "O(max(n, m))",
            spaceComplexity: "O(max(n, m))",
            examples: [{ input: "11, 1", output: "100" }],
            constraints: ["1 <= a.length, b.length <= 10^4"],
            solution: "Add bits from right to left with carry"
          },
          {
            title: "Climbing Stairs",
            description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps.",
            tags: ["math", "dynamic-programming"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "3", output: "3" }],
            constraints: ["1 <= n <= 45"],
            solution: "Fibonacci sequence: ways[n] = ways[n-1] + ways[n-2]"
          },
          {
            title: "Sqrt(x)",
            description: "Given a non-negative integer x, return the square root of x rounded down to the nearest integer.",
            tags: ["math", "binary-search"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "4", output: "2" }],
            constraints: ["0 <= x <= 2^31 - 1"],
            solution: "Binary search for the integer square root"
          },
          {
            title: "Merge Sorted Array",
            description: "Given two sorted integer arrays nums1 and nums2, merge nums2 into nums1 as one sorted array.",
            tags: ["array", "two-pointers"],
            timeComplexity: "O(n + m)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,0,0,0], [2,5,6]", output: "[1,2,2,3,5,6]" }],
            constraints: ["nums1.length = m + n"],
            solution: "Merge from the end to avoid extra space"
          }
        ],
        medium: [
          {
            title: "Longest Substring Without Repeating Characters",
            description: "Given a string s, find the length of the longest substring without repeating characters.",
            tags: ["string", "sliding-window", "hash-table"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(min(m,n))",
            examples: [{ input: "abcabcbb", output: "3" }],
            constraints: ["0 <= s.length <= 5 * 10^4"],
            solution: "Sliding window with hash set to track characters"
          },
          {
            title: "Longest Palindromic Substring",
            description: "Given a string s, return the longest palindromic substring in s.",
            tags: ["string", "dynamic-programming"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(1)",
            examples: [{ input: "babad", output: "\"bab\"" }],
            constraints: ["1 <= s.length <= 1000"],
            solution: "Expand around center approach"
          },
          {
            title: "Container With Most Water",
            description: "Given n non-negative integers representing heights, find two lines that form a container.",
            tags: ["array", "two-pointers", "greedy"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,8,6,2,5,4,8,3,7]", output: "49" }],
            constraints: ["n == height.length"],
            solution: "Two-pointer approach moving shorter side inward"
          },
          {
            title: "3Sum",
            description: "Given an integer array nums, return all triplets that sum to zero.",
            tags: ["array", "two-pointers", "sorting"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(k)",
            examples: [{ input: "[-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }],
            constraints: ["0 <= nums.length <= 3000"],
            solution: "Sort and use two-pointer for each fixed element"
          },
          {
            title: "Letter Combinations of a Phone Number",
            description: "Given a string containing digits from 2-9, return all possible letter combinations.",
            tags: ["string", "backtracking", "recursion"],
            timeComplexity: "O(3^n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "23", output: "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]" }],
            constraints: ["0 <= digits.length <= 4"],
            solution: "Backtracking to build combinations"
          },
          {
            title: "Generate Parentheses",
            description: "Given n pairs of parentheses, generate all combinations of well-formed parentheses.",
            tags: ["string", "backtracking", "recursion"],
            timeComplexity: "O(4^n / sqrt(n))",
            spaceComplexity: "O(n)",
            examples: [{ input: "3", output: "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]" }],
            constraints: ["1 <= n <= 8"],
            solution: "Backtracking with open/close count tracking"
          },
          {
            title: "Swap Nodes in Pairs",
            description: "Given a linked list, swap every two adjacent nodes and return its head.",
            tags: ["linked-list", "recursion"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,4]", output: "[2,1,4,3]" }],
            constraints: ["Number of nodes is even"],
            solution: "Iterative node swapping with previous pointer"
          },
          {
            title: "Reverse Nodes in k-Group",
            description: "Given a linked list, reverse the nodes of the list k at a time and return its modified list.",
            tags: ["linked-list", "recursion"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(k)",
            examples: [{ input: "[1,2,3,4,5], k=2", output: "[2,1,4,3,5]" }],
            constraints: "k is positive integer",
            solution: "Reverse k nodes recursively"
          },
          {
            title: "Remove Duplicates from Sorted List II",
            description: "Delete all nodes that have duplicate values from a sorted linked list.",
            tags: ["linked-list", "two-pointers"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,3,4,4,5]", output: "[1,2,5]" }],
            constraints: "Number of nodes <= 300",
            solution: "Use dummy head and skip duplicates"
          },
          {
            title: "Divide Two Integers",
            description: "Given two integers dividend and divisor, divide them without using multiplication or division.",
            tags: ["math", "bit-manipulation"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "10, 3", output: "3" }],
            constraints: "INT_MIN <= dividend, divisor <= INT_MAX",
            solution: "Bitwise division using subtraction"
          },
          {
            title: "Find First and Last Position of Element",
            description: "Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a target value.",
            tags: ["array", "binary-search"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[5,7,7,8,8,10], target=8", output: "[3,4]" }],
            constraints: ["0 <= nums.length <= 10^5"],
            solution: "Binary search for leftmost and rightmost positions"
          },
          {
            title: "Search in Rotated Sorted Array",
            description: "Given an integer array nums sorted in ascending order, and then rotated, search for target.",
            tags: ["array", "binary-search"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[4,5,6,7,0,1,2], target=0", output: "4" }],
            constraints: ["1 <= nums.length <= 5000"],
            solution: "Binary search considering rotation"
          },
          {
            title: "Search Insert Position",
            description: "Given a sorted array of distinct integers and a target value, return the index if the target is found.",
            tags: ["array", "binary-search"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,3,5,6], target=5", output: "2" }],
            constraints: ["1 <= nums.length <= 10^4"],
            solution: "Binary search to find insertion point"
          },
          {
            title: "Valid Sudoku",
            description: "Determine if a 9x9 Sudoku board is valid.",
            tags: ["array", "hash-table", "matrix"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "valid board", output: "true" }],
            constraints: "Board is 9x9",
            solution: "Check rows, columns, and 3x3 sub-boxes"
          },
          {
            title: "Solve Sudoku",
            description: "Write a program to solve a Sudoku puzzle by filling the empty cells.",
            tags: ["backtracking", "matrix", "recursion"],
            timeComplexity: "O(9^(81))",
            spaceComplexity: "O(81)",
            examples: [{ input: "partial board", output: "solved board" }],
            constraints: "Board is 9x9",
            solution: "Backtracking with constraint propagation"
          }
        ],
        hard: [
          {
            title: "Median of Two Sorted Arrays",
            description: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays.",
            tags: ["array", "binary-search", "divide-and-conquer"],
            timeComplexity: "O(log(min(m,n)))",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,3], [2]", output: "2.0" }],
            constraints: ["nums1.length + nums2.length >= 1"],
            solution: "Binary search on partition"
          },
          {
            title: "Regular Expression Matching",
            description: "Given an input string s and a pattern p, implement regular expression matching.",
            tags: ["string", "dynamic-programming", "recursion"],
            timeComplexity: "O(m*n)",
            spaceComplexity: "O(m*n)",
            examples: [{ input: "aa, a", output: "false" }],
            constraints: ["1 <= s.length <= 20"],
            solution: "DP with pattern matching rules"
          },
          {
            title: "Merge k Sorted Lists",
            description: "Given an array of k linked-lists, each linked-list is sorted in ascending order, merge all the linked-lists into one sorted linked-list.",
            tags: ["linked-list", "heap", "divide-and-conquer"],
            timeComplexity: "O(n log k)",
            spaceComplexity: "O(k)",
            examples: [{ input: "[[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }],
            constraints: ["k == lists.length"],
            solution: "Min-heap or divide and conquer approach"
          },
          {
            title: "Reverse Nodes in k-Group",
            description: "Given a linked list, reverse the nodes of the list k at a time and return its modified list.",
            tags: ["linked-list", "recursion"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(k)",
            examples: [{ input: "[1,2,3,4,5], k=2", output: "[2,1,4,3,5]" }],
            constraints: ["1 <= k <= n <= 5000"],
            solution: "Recursive reversal with k nodes"
          },
          {
            title: "Substring with Concatenation of All Words",
            description: "Given a string s and a list of words of the same length, find all starting indices of substring(s) that is a concatenation of each word exactly once.",
            tags: ["string", "hash-table", "sliding-window"],
            timeComplexity: "O(n * m * k)",
            spaceComplexity: "O(m * k)",
            examples: [{ input: "barfoothefoobarman, [\"foo\",\"bar\"]", output: "[0,9]" }],
            constraints: ["1 <= s.length <= 10^4"],
            solution: "Sliding window with word length optimization"
          },
          {
            title: "N-Queens",
            description: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard.",
            tags: ["backtracking", "recursion", "matrix"],
            timeComplexity: "O(n!)",
            spaceComplexity: "O(n^2)",
            examples: [{ input: "4", output: "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"]]" }],
            constraints: ["1 <= n <= 9"],
            solution: "Backtracking with column and diagonal checks"
          },
          {
            title: "Sudoku Solver",
            description: "Write a program to solve a Sudoku puzzle by filling the empty cells.",
            tags: ["backtracking", "matrix", "bitmask"],
            timeComplexity: "O(9^(81))",
            spaceComplexity: "O(81)",
            examples: [{ input: "partial board", output: "solved board" }],
            constraints: "Board is 9x9",
            solution: "Backtracking with constraint optimization"
          },
          {
            title: "Word Search",
            description: "Given an m x n board and a word, find if the word exists in the grid.",
            tags: ["matrix", "backtracking", "recursion"],
            timeComplexity: "O(m * n * 4^L)",
            spaceComplexity: "O(L)",
            examples: [{ input: "board, word", output: "true" }],
            constraints: ["1 <= m, n <= 6"],
            solution: "DFS with visited tracking"
          },
          {
            title: "Largest Rectangle in Histogram",
            description: "Given an array of integers heights representing the histogram's bar height, find the area of largest rectangle.",
            tags: ["array", "stack", "monotonic-stack"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "[2,1,5,6,2,3]", output: "10" }],
            constraints: ["1 <= heights.length <= 10^5"],
            solution: "Monotonic stack approach"
          },
          {
            title: "Maximal Rectangle",
            description: "Given a matrix containing 0s and 1s, find the area of the largest rectangle containing only 1s.",
            tags: ["matrix", "stack", "dynamic-programming"],
            timeComplexity: "O(m * n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "binary matrix", output: "area" }],
            constraints: ["m, n <= 300"],
            solution: "Histogram approach for each row"
          }
        ]
      },
      codeforces: {
        easy: [
          {
            title: "A. Plus One",
            description: "You are given a positive integer n. Your task is to add 1 to it and output the result.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "9", output: "10" }],
            constraints: ["1 <= n <= 10^9"],
            solution: "Simply add 1 to the input number"
          },
          {
            title: "A. Watermelon",
            description: "One hot summer day Pete and his friend Billy decided to buy a watermelon.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "4", output: "YES" }],
            constraints: ["1 <= w <= 100"],
            solution: "Check if weight is even and greater than 2"
          },
          {
            title: "A. Theatre Square",
            description: "Theatre Square in the capital city of Berland has a rectangular shape with n × m meters.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "6 6 4", output: "9" }],
            constraints: ["1 <= n, m <= 10^9"],
            solution: "Calculate ceil(n/a) * ceil(m/a)"
          },
          {
            title: "A. Bit++",
            description: "The famous programming competition Codeforces regularly hosts its rounds.",
            tags: ["string", "implementation"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "X++", output: "1" }],
            constraints: ["1 <= n <= 150"],
            solution: "Process ++ and -- operations"
          },
          {
            title: "A. Caps Lock",
            description: "Caps lock is a computer keyboard key. While it's pressed, all letters become uppercase.",
            tags: ["string", "implementation"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "cAPS", output: "Caps" }],
            constraints: ["1 <= s.length <= 100"],
            solution: "Toggle case based on caps lock state"
          },
          {
            title: "A. Word",
            description: "Vasya is very upset that many people on the Net mix uppercase and lowercase letters.",
            tags: ["string", "implementation"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "hELLo", output: "HELLO" }],
            constraints: ["1 <= s.length <= 100"],
            solution: "Check uppercase vs lowercase count"
          },
          {
            title: "A. Football",
            description: "Petya loves football very much. He goes to football matches and watches how his favorite team wins.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "1 1", output: "YES" }],
            constraints: ["0 <= a, b <= 100"],
            solution: "Check if team can win or not lose"
          },
          {
            title: "A. Drinks",
            description: "Old Vasya loves to drink Coka-Cola and Fanta very much.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "4 3", output: "YES" }],
            constraints: ["0 <= a, b <= 100"],
            solution: "Check if total bottles is even"
          },
          {
            title: "A. Boy or Girl",
            description: "Those days, many boys and girls came to the store to buy potatoes.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "BBB", output: "boy" }],
            constraints: ["1 <= s.length <= 100"],
            solution: "Check first character to determine gender"
          },
          {
            title: "A. Bus",
            description: "Vasya wants to go to the nearest park. He can use a bus or go on foot.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "6 4", output: "YES" }],
            constraints: ["1 <= a, b <= 100"],
            solution: "Check if walking is faster than bus"
          }
        ],
        medium: [
          {
            title: "B. Array Stabilization",
            description: "You are given an array a of n integers. Find the minimum number of operations to make the array stable.",
            tags: ["array", "sorting", "greedy"],
            timeComplexity: "O(n log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3]", output: "2" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Sort and minimize adjacent differences"
          },
          {
            title: "B. Interesting drink",
            description: "Vasya likes to drink tea very much. He drinks tea every day.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "7", output: "YES" }],
            constraints: ["1 <= a <= 100"],
            solution: "Check if number is prime or divisible by 4 or 7"
          },
          {
            title: "B. Choosing Symbol Pairs",
            description: "You are given a string s consisting of lowercase Latin letters.",
            tags: ["string", "implementation"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(1)",
            examples: [{ input: "abacaba", output: "26" }],
            constraints: ["1 <= |s| <= 100"],
            solution: "Count all possible character pairs"
          },
          {
            title: "B. Cutting",
            description: "There are a lot of things which could be cut — trees, paper, vegetables.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "175 140", output: "YES" }],
            constraints: ["1 <= a, b, c, d <= 100"],
            solution: "Check if total pieces can be distributed equally"
          },
          {
            title: "B. Meeting",
            description: "Old Vasya and Vanya are best friends. They meet every day.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "6 4", output: "YES" }],
            constraints: ["1 <= l, p, q, r <= 1000"],
            solution: "Check if they can meet within time constraints"
          },
          {
            title: "B. Growing Mushrooms",
            description: "Each morning Vasya goes to the forest to gather mushrooms.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "2 3", output: "YES" }],
            constraints: ["1 <= x1, x2 <= 100"],
            solution: "Check if mushrooms can grow equally"
          },
          {
            title: "B. Parade",
            description: "The Berland Armed Forces are preparing for a parade.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "4 7", output: "YES" }],
            constraints: ["1 <= n, k <= 100"],
            solution: "Check if parade formation is possible"
          },
          {
            title: "B. Chocolate",
            description: "Vasya loves chocolate very much. He eats a chocolate bar every day.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "4 2 6", output: "YES" }],
            constraints: ["1 <= n, a, b <= 100"],
            solution: "Check if chocolate can be divided equally"
          },
          {
            title: "B. Poker",
            description: "Vasya likes to play poker. He wants to become a professional player.",
            tags: ["math", "implementation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "9 6", output: "YES" }],
            constraints: ["1 <= n, k <= 100"],
            solution: "Check if poker game is possible"
          },
          {
            title: "B. Queue",
            description: "Vasya wants to buy a ticket for the cinema. There is a queue in front of the ticket office.",
            tags: ["math", "implementation"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "5 2", output: "YES" }],
            constraints: ["1 <= n, m <= 100"],
            solution: "Simulate queue operations"
          }
        ],
        hard: [
          {
            title: "C. Number of Ways",
            description: "You are given a positive integer n. Find the number of ways to write n as a sum of positive integers.",
            tags: ["math", "dynamic-programming", "combinatorics"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(n)",
            examples: [{ input: "4", output: "5" }],
            constraints: ["1 <= n <= 100"],
            solution: "Partition problem with DP"
          },
          {
            title: "C. Prime Number",
            description: "Vasya is studying prime numbers. He wants to find the largest prime number less than or equal to n.",
            tags: ["math", "number-theory", "sieve"],
            timeComplexity: "O(n log log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "10", output: "7" }],
            constraints: ["1 <= n <= 10^6"],
            solution: "Sieve of Eratosthenes"
          },
          {
            title: "C. Fibonacci Numbers",
            description: "Vasya is studying Fibonacci numbers. He wants to find the n-th Fibonacci number.",
            tags: ["math", "matrix-exponentiation", "dp"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "10", output: "55" }],
            constraints: ["1 <= n <= 10^18"],
            solution: "Matrix exponentiation or fast doubling"
          },
          {
            title: "C. Perfect Number",
            description: "A perfect number is a positive integer that is equal to the sum of its proper divisors.",
            tags: ["math", "number-theory"],
            timeComplexity: "O(sqrt(n))",
            spaceComplexity: "O(1)",
            examples: [{ input: "28", output: "YES" }],
            constraints: ["1 <= n <= 10^9"],
            solution: "Check divisors sum"
          },
          {
            title: "C. Power of Two",
            description: "Given an integer n, check if it is a power of two.",
            tags: ["math", "bit-manipulation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "16", output: "YES" }],
            constraints: ["1 <= n <= 10^18"],
            solution: "Check if only one bit is set"
          },
          {
            title: "C. GCD Problem",
            description: "Given two integers a and b, find their greatest common divisor.",
            tags: ["math", "number-theory", "euclidean"],
            timeComplexity: "O(log min(a,b))",
            spaceComplexity: "O(1)",
            examples: [{ input: "48 18", output: "6" }],
            constraints: ["1 <= a, b <= 10^9"],
            solution: "Euclidean algorithm"
          },
          {
            title: "C. LCM Problem",
            description: "Given two integers a and b, find their least common multiple.",
            tags: ["math", "number-theory"],
            timeComplexity: "O(log min(a,b))",
            spaceComplexity: "O(1)",
            examples: [{ input: "6 8", output: "24" }],
            constraints: ["1 <= a, b <= 10^9"],
            solution: "LCM = (a * b) / GCD(a,b)"
          },
          {
            title: "C. Modulo Operation",
            description: "Given integers a, b, and n, find (a + b) mod n.",
            tags: ["math", "modular-arithmetic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "10 20 30", output: "0" }],
            constraints: ["1 <= a, b, n <= 10^9"],
            solution: "Direct modulo operation"
          },
          {
            title: "C. Factorial",
            description: "Given an integer n, find n! (factorial).",
            tags: ["math", "combinatorics"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "5", output: "120" }],
            constraints: ["1 <= n <= 20"],
            solution: "Iterative multiplication"
          },
          {
            title: "C. Combination",
            description: "Given integers n and k, find C(n,k) - binomial coefficient.",
            tags: ["math", "combinatorics", "dp"],
            timeComplexity: "O(k)",
            spaceComplexity: "O(1)",
            examples: [{ input: "5 2", output: "10" }],
            constraints: ["0 <= k <= n <= 1000"],
            solution: "Iterative formula: C(n,k) = n!/(k!(n-k)!)"
          }
        ]
      },
      geeksforgeeks: {
        easy: [
          {
            title: "Reverse a String",
            description: "Write a function to reverse a given string.",
            tags: ["string", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "hello", output: "olleh" }],
            constraints: ["1 <= length <= 10^5"],
            solution: "Two-pointer approach or built-in reverse"
          },
          {
            title: "Check if String is Palindrome",
            description: "Given a string, write a function to check if it is palindrome or not.",
            tags: ["string", "two-pointers"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "racecar", output: "true" }],
            constraints: ["1 <= length <= 10^5"],
            solution: "Compare characters from both ends"
          },
          {
            title: "Find Largest Element in Array",
            description: "Given an array, find the largest element in it.",
            tags: ["array", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,4,5]", output: "5" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Linear scan to find maximum"
          },
          {
            title: "Find Second Largest Element",
            description: "Given an array, find the second largest element in it.",
            tags: ["array", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,4,5]", output: "4" }],
            constraints: ["2 <= n <= 10^5"],
            solution: "Track largest and second largest"
          },
          {
            title: "Check if Array is Sorted",
            description: "Given an array, check if it is sorted in non-decreasing order.",
            tags: ["array", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,4,5]", output: "true" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Check adjacent elements"
          },
          {
            title: "Count Occurrences in Array",
            description: "Given an array and a key, count the number of occurrences of the key.",
            tags: ["array", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,2,2], 2", output: "3" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Linear scan with counter"
          },
          {
            title: "Remove Duplicates from Array",
            description: "Given an array, remove all duplicates from it.",
            tags: ["array", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "[1,2,2,3,3,3]", output: "[1,2,3]" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Use set to track seen elements"
          },
          {
            title: "Find Missing Number",
            description: "Given an array of size n-1 containing numbers from 1 to n, find the missing number.",
            tags: ["array", "math"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,4,5]", output: "3" }],
            constraints: ["2 <= n <= 10^5"],
            solution: "XOR all elements or use sum formula"
          },
          {
            title: "Check if Number is Prime",
            description: "Given a number, check if it is prime or not.",
            tags: ["math", "basic"],
            timeComplexity: "O(sqrt(n))",
            spaceComplexity: "O(1)",
            examples: [{ input: "17", output: "true" }],
            constraints: ["1 <= n <= 10^9"],
            solution: "Check divisibility up to sqrt(n)"
          },
          {
            title: "Find Factorial of Number",
            description: "Given a number, find its factorial.",
            tags: ["math", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "5", output: "120" }],
            constraints: ["0 <= n <= 20"],
            solution: "Iterative multiplication"
          },
          {
            title: "Find Fibonacci Number",
            description: "Given n, find the nth Fibonacci number.",
            tags: ["math", "dp", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "7", output: "13" }],
            constraints: ["0 <= n <= 50"],
            solution: "Iterative DP or formula"
          },
          {
            title: "Check if Number is Even or Odd",
            description: "Given a number, check if it is even or odd.",
            tags: ["math", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "4", output: "even" }],
            constraints: ["1 <= n <= 10^9"],
            solution: "Check last bit"
          },
          {
            title: "Swap Two Numbers",
            description: "Given two numbers, swap them without using a temporary variable.",
            tags: ["math", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "a=5, b=3", output: "a=3, b=5" }],
            constraints: ["1 <= a, b <= 10^9"],
            solution: "Arithmetic or XOR swap"
          },
          {
            title: "Find GCD of Two Numbers",
            description: "Given two numbers, find their greatest common divisor.",
            tags: ["math", "basic"],
            timeComplexity: "O(log min(a,b))",
            spaceComplexity: "O(1)",
            examples: [{ input: "48, 18", output: "6" }],
            constraints: ["1 <= a, b <= 10^9"],
            solution: "Euclidean algorithm"
          },
          {
            title: "Find LCM of Two Numbers",
            description: "Given two numbers, find their least common multiple.",
            tags: ["math", "basic"],
            timeComplexity: "O(log min(a,b))",
            spaceComplexity: "O(1)",
            examples: [{ input: "6, 8", output: "24" }],
            constraints: ["1 <= a, b <= 10^9"],
            solution: "LCM = (a * b) / GCD(a,b)"
          },
          {
            title: "Check if Year is Leap Year",
            description: "Given a year, check if it is a leap year or not.",
            tags: ["math", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "2000", output: "true" }],
            constraints: ["1 <= year <= 10^9"],
            solution: "Check divisibility rules for leap year"
          }
        ],
        medium: [
          {
            title: "Find Maximum Subarray Sum",
            description: "Given an array of integers, find the maximum sum of any contiguous subarray.",
            tags: ["array", "dynamic-programming", "kadane"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,-2,5]", output: "9" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Kadane's algorithm"
          },
          {
            title: "Find Longest Increasing Subsequence",
            description: "Given an array, find the length of the longest increasing subsequence.",
            tags: ["array", "dynamic-programming", "binary-search"],
            timeComplexity: "O(n log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "[10,9,2,5,3,7,101,18]", output: "4" }],
            constraints: ["1 <= n <= 10^5"],
            solution: "Patience sorting with binary search"
          },
          {
            title: "Find All Subsets",
            description: "Given a set, find all possible subsets (power set).",
            tags: ["backtracking", "recursion", "bitmask"],
            timeComplexity: "O(2^n * n)",
            spaceComplexity: "O(2^n)",
            examples: [{ input: "[1,2,3]", output: "[[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]" }],
            constraints: ["1 <= n <= 20"],
            solution: "Backtracking or bitmask approach"
          },
          {
            title: "Find All Permutations",
            description: "Given a string, find all possible permutations of its characters.",
            tags: ["backtracking", "recursion"],
            timeComplexity: "O(n! * n)",
            spaceComplexity: "O(n! * n)",
            examples: [{ input: "ABC", output: "[ABC,ACB,BAC,BCA,CAB,CBA]" }],
            constraints: ["1 <= length <= 8"],
            solution: "Backtracking with swap approach"
          },
          {
            title: "Solve N-Queens Problem",
            description: "Place N queens on an N×N chessboard so that no two queens attack each other.",
            tags: ["backtracking", "recursion", "matrix"],
            timeComplexity: "O(n!)",
            spaceComplexity: "O(n^2)",
            examples: [{ input: "4", output: "2 solutions" }],
            constraints: ["1 <= n <= 10"],
            solution: "Backtracking with column and diagonal checks"
          },
          {
            title: "Find Longest Common Subsequence",
            description: "Given two strings, find the length of their longest common subsequence.",
            tags: ["string", "dynamic-programming"],
            timeComplexity: "O(m*n)",
            spaceComplexity: "O(m*n)",
            examples: [{ input: "ABCBDAB, BDCABA", output: "4" }],
            constraints: ["1 <= m, n <= 1000"],
            solution: "DP with O(m*n) time and space"
          },
          {
            title: "Find Edit Distance",
            description: "Given two strings, find the minimum number of operations to convert one string to another.",
            tags: ["string", "dynamic-programming"],
            timeComplexity: "O(m*n)",
            spaceComplexity: "O(m*n)",
            examples: [{ input: "horse, ros", output: "3" }],
            constraints: ["1 <= m, n <= 500"],
            solution: "DP with insert, delete, replace operations"
          },
          {
            title: "Find Minimum Number of Coins",
            description: "Given coin denominations and amount, find minimum number of coins needed.",
            tags: ["dynamic-programming", "greedy"],
            timeComplexity: "O(n*amount)",
            spaceComplexity: "O(amount)",
            examples: [{ input: "[1,2,5], 11", output: "3" }],
            constraints: ["1 <= amount <= 10^4"],
            solution: "DP with coin change formula"
          },
          {
            title: "Find Longest Palindromic Subsequence",
            description: "Given a string, find the length of the longest palindromic subsequence.",
            tags: ["string", "dynamic-programming"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(n^2)",
            examples: [{ input: "BBABCBCAB", output: "7" }],
            constraints: ["1 <= n <= 1000"],
            solution: "DP based on LCS with reverse string"
          },
          {
            title: "Find Matrix Chain Multiplication Cost",
            description: "Given dimensions of matrices, find the minimum cost of multiplying them.",
            tags: ["dynamic-programming", "matrix"],
            timeComplexity: "O(n^3)",
            spaceComplexity: "O(n^2)",
            examples: [{ input: "[10,30,5,60]", output: "4500" }],
            constraints: ["2 <= n <= 100"],
            solution: "DP with parenthesization optimization"
          },
          {
            title: "Find Shortest Path in DAG",
            description: "Given a DAG and source vertex, find shortest paths to all vertices.",
            tags: ["graph", "topological-sort", "dp"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "DAG with 5 vertices", output: "distances" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "Topological sort + DP"
          },
          {
            title: "Find Minimum Spanning Tree",
            description: "Given a weighted undirected graph, find its minimum spanning tree.",
            tags: ["graph", "kruskal", "prim", "union-find"],
            timeComplexity: "O(E log E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph with 4 vertices", output: "MST edges" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "Kruskal's algorithm with DSU"
          },
          {
            title: "Find Dijkstra Shortest Path",
            description: "Given a weighted graph and source vertex, find shortest paths to all vertices.",
            tags: ["graph", "dijkstra", "priority-queue"],
            timeComplexity: "O((V+E) log V)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph with 5 vertices", output: "shortest distances" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "Dijkstra's algorithm with min-heap"
          },
          {
            title: "Find Bellman Ford Shortest Path",
            description: "Given a weighted graph with negative edges, find shortest paths from source.",
            tags: ["graph", "bellman-ford", "negative-edges"],
            timeComplexity: "O(V*E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph with negative edges", output: "shortest distances" }],
            constraints: ["1 <= V, E <= 500"],
            solution: "Bellman-Ford with negative cycle detection"
          },
          {
            title: "Find Floyd Warshall All Pairs Shortest Path",
            description: "Given a weighted graph, find shortest paths between all pairs of vertices.",
            tags: ["graph", "floyd-warshall", "dp"],
            timeComplexity: "O(V^3)",
            spaceComplexity: "O(V^2)",
            examples: [{ input: "graph with 4 vertices", output: "distance matrix" }],
            constraints: ["1 <= V <= 500"],
            solution: "DP with intermediate vertices"
          }
        ],
        hard: [
          {
            title: "Traveling Salesman Problem",
            description: "Given a set of cities and distances, find the shortest possible route that visits each city exactly once.",
            tags: ["graph", "dp", "bitmask", "np-hard"],
            timeComplexity: "O(n^2 * 2^n)",
            spaceComplexity: "O(n * 2^n)",
            examples: [{ input: "4 cities", output: "optimal route" }],
            constraints: ["1 <= n <= 20"],
            solution: "DP with bitmask for small n"
          },
          {
            title: "Graph Coloring Problem",
            description: "Given an undirected graph, determine if it can be colored with k colors.",
            tags: ["graph", "backtracking", "np-complete"],
            timeComplexity: "O(k^V)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph with 4 vertices, k=3", output: "possible" }],
            constraints: ["1 <= V <= 100"],
            solution: "Backtracking with pruning"
          },
          {
            title: "Knapsack Problem",
            description: "Given weights and values of items, find maximum value that fits in knapsack of capacity W.",
            tags: ["dp", "optimization", "np-complete"],
            timeComplexity: "O(n*W)",
            spaceComplexity: "O(W)",
            examples: [{ input: "items with weights and values", output: "max value" }],
            constraints: ["1 <= n, W <= 1000"],
            solution: "DP with 0/1 knapsack"
          },
          {
            title: "Subset Sum Problem",
            description: "Given a set of positive integers, find if there exists a subset that sums to target.",
            tags: ["dp", "subset", "np-complete"],
            timeComplexity: "O(n*target)",
            spaceComplexity: "O(target)",
            examples: [{ input: "[3,34,4,12,5,2], target=9", output: "true" }],
            constraints: ["1 <= n, target <= 1000"],
            solution: "DP with subset sum"
          },
          {
            title: "Partition Problem",
            description: "Given a set of positive integers, determine if it can be partitioned into two equal subsets.",
            tags: ["dp", "partition", "np-complete"],
            timeComplexity: "O(n*sum)",
            spaceComplexity: "O(sum)",
            examples: [{ input: "[1,5,11,5]", output: "true" }],
            constraints: ["1 <= n <= 200"],
            solution: "DP with equal partition check"
          },
          {
            title: "Word Break Problem",
            description: "Given a string and dictionary, determine if string can be segmented into dictionary words.",
            tags: ["dp", "string", "word-break"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(n)",
            examples: [{ input: "leetcode, [leet, code]", output: "true" }],
            constraints: ["1 <= n <= 1000"],
            solution: "DP with word dictionary"
          },
          {
            title: "Palindrome Partitioning",
            description: "Given a string, partition it into substrings such that each substring is a palindrome.",
            tags: ["dp", "palindrome", "backtracking"],
            timeComplexity: "O(n^3)",
            spaceComplexity: "O(n^2)",
            examples: [{ input: "aab", output: "[[a,a,b],[aa,b]]" }],
            constraints: ["1 <= n <= 1000"],
            solution: "DP with palindrome precomputation"
          },
          {
            title: "Maximum Sum Rectangle",
            description: "Given a 2D matrix, find the rectangle with maximum sum.",
            tags: ["matrix", "dp", "2d-kadane"],
            timeComplexity: "O(n^3)",
            spaceComplexity: "O(n^2)",
            examples: [{ input: "matrix with positive and negative numbers", output: "max sum" }],
            constraints: ["1 <= m, n <= 100"],
            solution: "2D Kadane's algorithm"
          },
          {
            title: "Longest Path in DAG",
            description: "Given a DAG, find the longest path from source to destination.",
            tags: ["graph", "dp", "topological-sort"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "DAG with 6 vertices", output: "longest path length" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "Topological sort + DP"
          },
          {
            title: "Count All Paths in DAG",
            description: "Given a DAG, count all possible paths from source to destination.",
            tags: ["graph", "dp", "topological-sort"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "DAG with 4 vertices", output: "path count" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "DP with topological order"
          },
          {
            title: "Find Strongly Connected Components",
            description: "Given a directed graph, find all strongly connected components.",
            tags: ["graph", "kosaraju", "tarjan", "scc"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "directed graph", output: "SCCs" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "Kosaraju's algorithm"
          },
          {
            title: "Find Articulation Points",
            description: "Given an undirected graph, find all articulation points (cut vertices).",
            tags: ["graph", "dfs", "low-link", "articulation"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph", output: "cut vertices" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "DFS with low-link values"
          },
          {
            title: "Find Bridges in Graph",
            description: "Given an undirected graph, find all bridges (cut edges).",
            tags: ["graph", "dfs", "low-link", "bridges"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph", output: "bridges" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "DFS with discovery and low times"
          },
          {
            title: "Find Minimum Vertex Cover",
            description: "Given a bipartite graph, find minimum vertex cover using Kőnig's theorem.",
            tags: ["graph", "bipartite", "matching", "vertex-cover"],
            timeComplexity: "O(V*E)",
            spaceComplexity: "O(V+E)",
            examples: [{ input: "bipartite graph", output: "min vertex cover" }],
            constraints: ["1 <= V, E <= 10^5"],
            solution: "Maximum matching + vertex cover"
          }
        ]
      },
      hackerrank: {
        easy: [
          {
            title: "Solve Me First",
            description: "Complete the function solveMeFirst to compute the sum of two integers.",
            tags: ["basic", "math"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "2, 3", output: "5" }],
            constraints: ["1 <= a, b <= 1000"],
            solution: "Simply add the two numbers"
          },
          {
            title: "Simple Array Sum",
            description: "Given an array of integers, find the sum of all elements.",
            tags: ["array", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3,4,5]", output: "15" }],
            constraints: ["1 <= n <= 1000"],
            solution: "Iterate and accumulate sum"
          },
          {
            title: "Compare Triplets",
            description: "Compare two triplets and determine their relationship.",
            tags: ["comparison", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "(1,2,3), (1,2,3)", output: "equal" }],
            constraints: ["-100 <= a_i, b_i <= 100"],
            solution: "Component-wise comparison"
          },
          {
            title: "Conditional Statements",
            description: "Use conditional statements to determine the larger of two numbers.",
            tags: ["conditional", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "3, 5", output: "5" }],
            constraints: ["1 <= a, b <= 100"],
            solution: "Simple if-else comparison"
          },
          {
            title: "String Manipulation",
            description: "Perform basic string operations like concatenation and length.",
            tags: ["string", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "hello, world", output: "helloworld" }],
            constraints: ["1 <= len <= 100"],
            solution: "String concatenation"
          },
          {
            title: "Loops",
            description: "Use loops to print numbers from 1 to 10.",
            tags: ["loops", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "10", output: "1 2 3 ... 10" }],
            constraints: ["1 <= n <= 100"],
            solution: "For loop iteration"
          },
          {
            title: "Data Types",
            description: "Understand and use different data types like int, float, char, string.",
            tags: ["data-types", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "various types", output: "proper usage" }],
            constraints: ["Standard type limits"],
            solution: "Proper type selection and usage"
          },
          {
            title: "Functions",
            description: "Define and call functions to perform specific tasks.",
            tags: ["functions", "basic"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "function call", output: "return value" }],
            constraints: ["Standard function limits"],
            solution: "Function definition and invocation"
          },
          {
            title: "Arrays Introduction",
            description: "Learn basic array operations like access, update, and iterate.",
            tags: ["arrays", "basic"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "[1,2,3]", output: "array operations" }],
            constraints: ["1 <= n <= 100"],
            solution: "Array indexing and iteration"
          },
          {
            title: "List Comprehensions",
            description: "Use list comprehensions to create lists based on conditions.",
            tags: ["list-comprehension", "python"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "1-10", output: "squares" }],
            constraints: ["1 <= n <= 100"],
            solution: "List comprehension syntax"
          },
          {
            title: "Dictionary Operations",
            description: "Perform basic dictionary operations like add, access, delete.",
            tags: ["dictionary", "python"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(n)",
            examples: [{ input: "key-value pairs", output: "operations" }],
            constraints: ["1 <= n <= 1000"],
            solution: "Dictionary methods"
          },
          {
            title: "String Formatting",
            description: "Format strings using various methods like f-strings, format method.",
            tags: ["string", "formatting"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "name, age", output: "formatted string" }],
            constraints: ["1 <= len <= 100"],
            solution: "String formatting techniques"
          },
          {
            title: "File Operations",
            description: "Read from and write to files using basic file operations.",
            tags: ["file", "io"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "file path", output: "file content" }],
            constraints: ["1 <= file size <= 1MB"],
            solution: "File read/write operations"
          },
          {
            title: "Error Handling",
            description: "Handle errors using try-except blocks and raise exceptions.",
            tags: ["error", "exception"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            examples: [{ input: "error condition", output: "handled gracefully" }],
            constraints: ["Standard error types"],
            solution: "Try-except patterns"
          }
        ],
        medium: [
          {
            title: "2D Array DS",
            description: "Work with 2D arrays and perform operations like rotation, transpose.",
            tags: ["2d-array", "matrix"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(1)",
            examples: [{ input: "3x3 matrix", output: "rotated matrix" }],
            constraints: ["1 <= n, m <= 100"],
            solution: "Matrix operations"
          },
          {
            title: "Subarray Division",
            description: "Divide array into subarrays based on given conditions.",
            tags: ["array", "division"],
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "[1,2,3,4,5], k=2", output: "[[1,2],[3,4],[5]]" }],
            constraints: ["1 <= n <= 1000"],
            solution: "Array slicing"
          },
          {
            title: "Queue Operations",
            description: "Implement queue operations like enqueue, dequeue, front, rear.",
            tags: ["queue", "data-structure"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(n)",
            examples: [{ input: "queue operations", output: "queue state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Queue implementation"
          },
          {
            title: "Stack Operations",
            description: "Implement stack operations like push, pop, top, empty.",
            tags: ["stack", "data-structure"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(n)",
            examples: [{ input: "stack operations", output: "stack state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Stack implementation"
          },
          {
            title: "Tree Operations",
            description: "Implement basic tree operations like insertion, deletion, traversal.",
            tags: ["tree", "data-structure"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "tree operations", output: "tree state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "BST operations"
          },
          {
            title: "Hash Table Operations",
            description: "Implement hash table operations like insert, delete, search.",
            tags: ["hash-table", "data-structure"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(n)",
            examples: [{ input: "hash operations", output: "hash state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Hash table implementation"
          },
          {
            title: "Sorting Algorithms",
            description: "Implement various sorting algorithms like quicksort, mergesort, heapsort.",
            tags: ["sorting", "algorithms"],
            timeComplexity: "O(n log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "unsorted array", output: "sorted array" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Sorting algorithm implementation"
          },
          {
            title: "Searching Algorithms",
            description: "Implement binary search, linear search, and other search techniques.",
            tags: ["searching", "algorithms"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "sorted array, target", output: "index" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Binary search implementation"
          },
          {
            title: "Recursion",
            description: "Solve problems using recursive approaches and understand stack frames.",
            tags: ["recursion", "algorithms"],
            timeComplexity: "O(2^n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "recursive problem", output: "solution" }],
            constraints: ["1 <= n <= 20"],
            solution: "Recursive function implementation"
          },
          {
            title: "Dynamic Programming",
            description: "Solve problems using DP techniques like memoization and tabulation.",
            tags: ["dp", "algorithms"],
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(n)",
            examples: [{ input: "DP problem", output: "optimal solution" }],
            constraints: ["1 <= n <= 1000"],
            solution: "DP implementation"
          },
          {
            title: "Greedy Algorithms",
            description: "Solve optimization problems using greedy approaches.",
            tags: ["greedy", "algorithms"],
            timeComplexity: "O(n log n)",
            spaceComplexity: "O(1)",
            examples: [{ input: "optimization problem", output: "greedy solution" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Greedy algorithm implementation"
          },
          {
            title: "Graph Traversal",
            description: "Implement BFS and DFS traversal algorithms for graphs.",
            tags: ["graph", "algorithms"],
            timeComplexity: "O(V+E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph", output: "traversal order" }],
            constraints: ["1 <= V, E <= 10000"],
            solution: "BFS/DFS implementation"
          },
          {
            title: "Shortest Path",
            description: "Find shortest paths in weighted and unweighted graphs.",
            tags: ["graph", "algorithms"],
            timeComplexity: "O((V+E) log V)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph, source", output: "shortest paths" }],
            constraints: ["1 <= V, E <= 10000"],
            solution: "Dijkstra's algorithm"
          },
          {
            title: "Minimum Spanning Tree",
            description: "Find MST in weighted undirected graphs using Kruskal or Prim.",
            tags: ["graph", "algorithms"],
            timeComplexity: "O(E log E)",
            spaceComplexity: "O(V)",
            examples: [{ input: "graph", output: "MST edges" }],
            constraints: ["1 <= V, E <= 10000"],
            solution: "Kruskal's algorithm"
          },
          {
            title: "String Algorithms",
            description: "Implement string algorithms like KMP, Rabin-Karp, Z-algorithm.",
            tags: ["string", "algorithms"],
            timeComplexity: "O(n+m)",
            spaceComplexity: "O(n+m)",
            examples: [{ input: "text, pattern", output: "occurrences" }],
            constraints: ["1 <= n, m <= 10000"],
            solution: "String matching algorithm"
          }
        ],
        hard: [
          {
            title: "Advanced Data Structures",
            description: "Implement advanced data structures like segment trees, fenwick trees.",
            tags: ["data-structures", "advanced"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "range queries", output: "query results" }],
            constraints: ["1 <= n <= 100000"],
            solution: "Segment tree implementation"
          },
          {
            title: "Network Flow",
            description: "Implement Ford-Fulkerson algorithm for maximum flow problems.",
            tags: ["graph", "flow", "algorithms"],
            timeComplexity: "O(E * max_flow)",
            spaceComplexity: "O(V+E)",
            examples: [{ input: "flow network", output: "max flow" }],
            constraints: ["1 <= V, E <= 500"],
            solution: "Ford-Fulkerson implementation"
          },
          {
            title: "Bipartite Matching",
            description: "Implement maximum bipartite matching using Hungarian algorithm.",
            tags: ["graph", "matching", "algorithms"],
            timeComplexity: "O(V^3)",
            spaceComplexity: "O(V^2)",
            examples: [{ input: "bipartite graph", output: "max matching" }],
            constraints: ["1 <= V <= 500"],
            solution: "Hungarian algorithm"
          },
          {
            title: "Suffix Array",
            description: "Construct suffix array and use it for string operations.",
            tags: ["string", "advanced", "algorithms"],
            timeComplexity: "O(n log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "string", output: "suffix array" }],
            constraints: ["1 <= n <= 100000"],
            solution: "Suffix array construction"
          },
          {
            title: "Trie Implementation",
            description: "Implement trie data structure for efficient string operations.",
            tags: ["trie", "data-structure", "advanced"],
            timeComplexity: "O(m)",
            spaceComplexity: "O(m*n)",
            examples: [{ input: "word operations", output: "trie operations" }],
            constraints: ["1 <= n, m <= 10000"],
            solution: "Trie implementation"
          },
          {
            title: "Disjoint Set Union",
            description: "Implement DSU with path compression and union by rank.",
            tags: ["dsu", "data-structure", "advanced"],
            timeComplexity: "O(α(n))",
            spaceComplexity: "O(n)",
            examples: [{ input: "union operations", output: "DSU state" }],
            constraints: ["1 <= n <= 100000"],
            solution: "DSU with optimizations"
          },
          {
            title: "LRU Cache",
            description: "Implement LRU cache with O(1) get and put operations.",
            tags: ["cache", "data-structure", "advanced"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(capacity)",
            examples: [{ input: "cache operations", output: "cache state" }],
            constraints: ["1 <= capacity <= 10000"],
            solution: "LRU with hashmap and doubly linked list"
          },
          {
            title: "Red-Black Tree",
            description: "Implement self-balancing binary search tree with O(log n) operations.",
            tags: ["tree", "data-structure", "advanced"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "tree operations", output: "tree state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Red-Black tree implementation"
          },
          {
            title: "AVL Tree",
            description: "Implement self-balancing binary search tree with O(log n) operations.",
            tags: ["tree", "data-structure", "advanced"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "tree operations", output: "tree state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "AVL tree implementation"
          },
          {
            title: "B-Tree",
            description: "Implement B-tree for disk-based storage systems.",
            tags: ["tree", "data-structure", "advanced"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "B-tree operations", output: "tree state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "B-tree implementation"
          },
          {
            title: "Skip List",
            description: "Implement skip list for probabilistic data structure operations.",
            tags: ["skip-list", "data-structure", "advanced"],
            timeComplexity: "O(log n)",
            spaceComplexity: "O(n)",
            examples: [{ input: "skip list operations", output: "list state" }],
            constraints: ["1 <= n <= 10000"],
            solution: "Skip list implementation"
          },
          {
            title: "Bloom Filter",
            description: "Implement probabilistic data structure for membership testing.",
            tags: ["bloom-filter", "data-structure", "advanced"],
            timeComplexity: "O(k)",
            spaceComplexity: "O(m)",
            examples: [{ input: "membership tests", output: "probabilistic results" }],
            constraints: ["1 <= m <= 1000000"],
            solution: "Bloom filter implementation"
          },
          {
            title: "Count-Min Sketch",
            description: "Implement probabilistic data structure for frequency estimation.",
            tags: ["count-min-sketch", "data-structure", "advanced"],
            timeComplexity: "O(k)",
            spaceComplexity: "O(k*w)",
            examples: [{ input: "frequency queries", output: "estimates" }],
            constraints: ["1 <= k, w <= 1000"],
            solution: "Count-min sketch implementation"
          }
        ]
      }
    };

    // Get questions for the specific source and difficulty
    const sourceQuestions = questionDatabase[source]?.[difficulty] || [];
    
    // If we need more questions than available, create variations
    if (sourceQuestions.length < count) {
      const expandedQuestions = [];
      let questionIndex = 0;
      
      while (expandedQuestions.length < count) {
        const baseQuestion = sourceQuestions[questionIndex % sourceQuestions.length];
        const variation = expandedQuestions.length % 3; // Create 3 variations per question
        
        const question = {
          ...baseQuestion,
          source: source, // Add source field
          difficulty: difficulty, // Add difficulty field
          id: `${source}_${difficulty}_${Date.now()}_${expandedQuestions.length}`,
          title: `${baseQuestion.title} ${variation > 0 ? `(Variant ${variation + 1})` : ''}`,
          // Add slight variations to make questions unique
          examples: baseQuestion.examples.map((ex, idx) => ({
            ...ex,
            input: variation === 1 ? `${ex.input} (Modified)` : ex.input,
            output: variation === 2 ? `${ex.output} (Alternative)` : ex.output
          })),
          // Randomize some values for variety
          constraints: typeof baseQuestion.constraints === 'string' 
            ? [baseQuestion.constraints] 
            : baseQuestion.constraints.map((c, idx) => {
                if (variation === 1 && idx === 0) {
                  // Slightly modify first constraint
                  return c.replace(/\d+/, (match) => (parseInt(match) + Math.floor(Math.random() * 5 - 2)).toString());
                }
                return c;
              })
        };
        
        expandedQuestions.push(question);
        questionIndex++;
      }
      
      return expandedQuestions.slice(0, count);
    }
    
    // Return requested number of questions (shuffle for variety)
    const shuffled = [...sourceQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, sourceQuestions.length)).map(q => ({
      ...q,
      source: source, // Add source field
      difficulty: difficulty // Add difficulty field
    }));
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.some(q => q.id === questionId)
        ? prev.filter(q => q.id !== questionId)
        : [...prev, generatedQuestions.find(q => q.id === questionId)]
    );
  };

  const selectAllQuestions = () => {
    setSelectedQuestions([...generatedQuestions]);
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions([]);
  };

  const previewQuestionHandler = (question) => {
    setPreviewQuestion(question);
    setShowPreview(true);
  };

  const saveToCollection = () => {
    if (!collectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    const newCollection = {
      id: Date.now().toString(),
      name: collectionName,
      questions: selectedQuestions,
      createdAt: new Date().toISOString(),
      stats: {
        total: selectedQuestions.length,
        byDifficulty: selectedQuestions.reduce((acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
          return acc;
        }, {}),
        bySource: selectedQuestions.reduce((acc, q) => {
          acc[q.source.id] = (acc[q.source.id] || 0) + 1;
          return acc;
        }, {})
      }
    };

    setSavedCollections(prev => [...prev, newCollection]);
    setShowSaveModal(false);
    setCollectionName('');
    toast.success(`Collection "${collectionName}" saved successfully!`);
  };

  const loadCollection = (collection) => {
    setCurrentCollection(collection);
    setGeneratedQuestions(collection.questions);
    setSelectedQuestions([]);
    toast.success(`Loaded collection "${collection.name}"`);
  };

  const deleteCollection = (collectionId) => {
    setSavedCollections(prev => prev.filter(c => c.id !== collectionId));
    toast.success('Collection deleted successfully');
  };

  // Function to create exam with generated questions and randomization
  const createExamWithQuestions = async (questions, generationId) => {
    // Check if this generation is still valid (using ref)
    if (currentGenerationRef.current !== generationId) {
      console.log('Exam creation already in progress or stale generation, skipping...', { currentGeneration: currentGenerationRef.current, generationId });
      return;
    }
    if (!examConfig.name || !examConfig.dateTime) {
      toast.error('Please complete exam configuration');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsCreatingExam(true);
    
    try {
      // First test if backend is reachable using adminAPI
      console.log('Testing backend connection...');
      try {
        await adminAPI.getExams({ limit: 1 }); // Simple test call
        console.log('Backend connection successful');
      } catch (testError) {
        console.log('Backend connection test failed:', testError);
        if (testError.isNetworkError || testError.code === 'ECONNREFUSED' || testError.code === 'ERR_NETWORK') {
          throw new Error('Backend server is not running. Please start the backend server on port 5000.');
        }
      }

      // Calculate total marks based on questions
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 10), 0);
      
      // Create randomized question sets for each student
      const studentQuestionSets = {};
      
      selectedStudents.forEach(studentId => {
        // Create a unique shuffled set of questions for each student
        const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
        
        // Add randomization metadata
        const randomizedQuestions = shuffledQuestions.map((q, index) => ({
          ...q,
          studentOrder: index + 1,
          randomSeed: Math.random(),
          // Add slight variations to make each student's experience unique
          questionText: q.questionText + (index % 3 === 0 ? ' [Modified for Student]' : '')
        }));
        
        studentQuestionSets[studentId] = randomizedQuestions;
      });

      // Create exam with randomized questions
      const examData = {
        ...examConfig,
        totalMarks,
        duration: parseInt(examConfig.duration),
        passingMarks: parseInt(examConfig.passingMarks),
        questions: questions, // Master question set
        studentQuestionSets, // Per-student randomized sets
        studentIds: selectedStudents,
        questionRandomization: true,
        aiGenerated: true,
        createdAt: new Date().toISOString()
      };

      console.log('Sending exam data:', examData);
      
      const res = await adminAPI.createExam(examData);
      
      console.log('Exam creation response:', res);
      
      toast.success(`Exam "${examConfig.name}" created successfully with ${questions.length} questions for ${selectedStudents.length} students!`);
      
      // Navigate to exam management
      setTimeout(() => {
        navigate('/admin/exams', { 
          state: { 
            examCreated: true,
            examId: res.data.id,
            message: `Exam created with AI-generated questions and automatic randomization`
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('=== EXAM CREATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error code:', error.code);
      console.error('Error config:', error.config);
      
      // Check for specific error types
      if (error.isNetworkError || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if the backend server is running on port 5000.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => navigate('/admin/login'), 2000);
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please check the backend logs for details.');
      } else {
        // Show detailed error message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create exam. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsCreatingExam(false);
    }
  };

  // Helper functions for student selection
  const toggleStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) 
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
  };

  const toggleAllStudents = () => {
    setSelectedStudents(prev => 
      prev.length === allStudents.length ? [] : allStudents.map(s => s.id)
    );
  };

  const updateExamConfig = (field, value) => {
    setExamConfig(prev => ({ ...prev, [field]: value }));
  };

  const exportQuestions = () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select questions to export');
      return;
    }

    const exportData = {
      questions: selectedQuestions,
      exportedAt: new Date().toISOString(),
      stats: {
        total: selectedQuestions.length,
        byDifficulty: selectedQuestions.reduce((acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
          return acc;
        }, {}),
        bySource: selectedQuestions.reduce((acc, q) => {
          acc[q.source.id] = (acc[q.source.id] || 0) + 1;
          return acc;
        }, {})
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-questions-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Questions exported successfully!');
  };

  const filteredQuestions = generatedQuestions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesSource = filterSource === 'all' || q.source === filterSource;
    return matchesSearch && matchesDifficulty && matchesSource;
  });

  const getDifficultyColor = (difficulty) => {
    const diff = difficulties.find(d => d.value === difficulty);
    return diff ? diff.color : '#64748b';
  };

  return (
    <div className="admin-pages-container">
      <div className="admin-ai-generator-page">
        {/* Header */}
        <div className="admin-page-header">
          <div className="admin-header-content">
            <h1 className="admin-page-title">
              <Brain size={32} />
              AI Question Generator
            </h1>
            <p className="admin-page-subtitle">
              Generate intelligent coding questions from multiple platforms
            </p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/exams')}>
              <FileText size={16} />
              Create Exam
            </button>
          </div>
        </div>

        {/* AI Mode Selection */}
        <div className="admin-ai-mode-selector">
          <h3 className="admin-ai-title">
            <Sparkles size={24} />
            Choose Generation Mode
          </h3>
          <div className="admin-ai-modes">
            <button 
              className={`admin-ai-mode-btn ${mode === 'partial' ? 'active' : ''}`}
              onClick={() => setMode('partial')}
            >
              <Layers size={20} />
              <div>
                <div className="admin-ai-mode-name">Partial AI Mode</div>
                <div className="admin-ai-mode-desc">Review and select questions manually</div>
              </div>
            </button>
            <button 
              className={`admin-ai-mode-btn ${mode === 'full' ? 'active' : ''}`}
              onClick={() => setMode('full')}
            >
              <Zap size={20} />
              <div>
                <div className="admin-ai-mode-name">Full AI Mode</div>
                <div className="admin-ai-mode-desc">Generate questions and automatically create exam</div>
              </div>
            </button>
          </div>
        </div>

        {/* Generation Configuration */}
        <div className="admin-ai-config">
          <div className="admin-ai-config-grid">
            <div className="admin-ai-config-item">
              <label className="admin-ai-config-label">
                <Search size={16} />
                Topic/Keywords
              </label>
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., arrays, dynamic programming, trees"
                className="admin-ai-input"
              />
            </div>

            <div className="admin-ai-config-item">
              <label className="admin-ai-config-label">
                <Target size={16} />
                Difficulty
              </label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="admin-ai-select"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-ai-config-item">
              <label className="admin-ai-config-label">
                <BarChart3 size={16} />
                Number of Questions
              </label>
              <input 
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
                className="admin-ai-input"
              />
            </div>
          </div>

          {/* Source Selection */}
          <div className="admin-ai-sources">
            <label className="admin-ai-sources-label">
              <Database size={16} />
              Select Sources
            </label>
            <div className="admin-ai-sources-grid">
              {sources.map(source => (
                <button 
                  key={source.id}
                  className={`admin-ai-source-btn ${selectedSources.includes(source.id) ? 'selected' : ''}`}
                  onClick={() => toggleSource(source.id)}
                >
                  <source.icon size={20} color={source.color} />
                  <div>
                    <span>{source.name}</span>
                    <small>{source.description}</small>
                  </div>
                  {selectedSources.includes(source.id) && <CheckCircle size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Configuration for Full Mode */}
          {mode === 'full' && (
            <div className="admin-ai-exam-config">
              <h3 className="admin-ai-exam-config-title">
                <Calendar size={20} />
                Exam Configuration
              </h3>
              <div className="admin-ai-exam-config-grid">
                <div className="admin-ai-exam-config-item">
                  <label className="admin-ai-exam-config-label">
                    <FileText size={16} />
                    Exam Name
                  </label>
                  <input 
                    type="text"
                    value={examConfig.name}
                    onChange={(e) => updateExamConfig('name', e.target.value)}
                    placeholder="e.g., Data Structures Midterm"
                    className="admin-ai-exam-input"
                  />
                </div>

                <div className="admin-ai-exam-config-item">
                  <label className="admin-ai-exam-config-label">
                    <BookOpen size={16} />
                    Subject
                  </label>
                  <input 
                    type="text"
                    value={examConfig.subject}
                    onChange={(e) => updateExamConfig('subject', e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="admin-ai-exam-input"
                  />
                </div>

                <div className="admin-ai-exam-config-item">
                  <label className="admin-ai-exam-config-label">
                    <Clock size={16} />
                    Date & Time
                  </label>
                  <input 
                    type="datetime-local"
                    value={examConfig.dateTime}
                    onChange={(e) => updateExamConfig('dateTime', e.target.value)}
                    className="admin-ai-exam-input"
                  />
                </div>

                <div className="admin-ai-exam-config-item">
                  <label className="admin-ai-exam-config-label">
                    <Clock size={16} />
                    Duration (minutes)
                  </label>
                  <input 
                    type="number"
                    value={examConfig.duration}
                    onChange={(e) => updateExamConfig('duration', Math.max(15, parseInt(e.target.value) || 60))}
                    min="15"
                    max="300"
                    className="admin-ai-exam-input"
                  />
                </div>

                <div className="admin-ai-exam-config-item">
                  <label className="admin-ai-exam-config-label">
                    <Award size={16} />
                    Passing Marks
                  </label>
                  <input 
                    type="number"
                    value={examConfig.passingMarks}
                    onChange={(e) => updateExamConfig('passingMarks', Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    className="admin-ai-exam-input"
                  />
                </div>

                <div className="admin-ai-exam-config-item">
                  <label className="admin-ai-exam-config-label">
                    <Shield size={16} />
                    Proctoring
                  </label>
                  <select 
                    value={examConfig.isProctored ? 'enabled' : 'disabled'}
                    onChange={(e) => updateExamConfig('isProctored', e.target.value === 'enabled')}
                    className="admin-ai-exam-select"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Student Selection */}
              <div className="admin-ai-student-selection">
                <div className="admin-ai-student-header">
                  <h4 className="admin-ai-student-title">
                    <Users size={20} />
                    Select Students ({selectedStudents.length} selected)
                  </h4>
                  <div className="admin-ai-student-actions">
                    <button 
                      onClick={toggleAllStudents}
                      className="admin-ai-student-toggle-btn"
                    >
                      {selectedStudents.length === allStudents.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
                <div className="admin-ai-student-grid">
                  {allStudents.slice(0, 20).map(student => (
                    <div key={student.id} className="admin-ai-student-item">
                      <input 
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="admin-ai-student-checkbox"
                      />
                      <div className="admin-ai-student-info">
                        <div className="admin-ai-student-name">{student.name}</div>
                        <div className="admin-ai-student-email">{student.email}</div>
                      </div>
                    </div>
                  ))}
                  {allStudents.length > 20 && (
                    <div className="admin-ai-student-more">
                      +{allStudents.length - 20} more students
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="admin-ai-exam-instructions">
                <label className="admin-ai-exam-config-label">
                  <HelpCircle size={16} />
                  Exam Instructions
                </label>
                <textarea 
                  value={examConfig.instructions}
                  onChange={(e) => updateExamConfig('instructions', e.target.value)}
                  placeholder="Enter exam instructions for students..."
                  rows={3}
                  className="admin-ai-exam-textarea"
                />
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="admin-ai-generate-section">
            <button 
              onClick={generateQuestions}
              disabled={isGenerating || isCreatingExam || !topic.trim() || selectedSources.length === 0}
              className="admin-ai-generate-btn"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Generating Questions...
                </>
              ) : isCreatingExam ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Creating Exam...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  {mode === 'full' ? 'Generate & Create Exam' : 'Generate Questions'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generation Stats */}
        {generationStats && (
          <div className="admin-ai-stats">
            <h4 className="admin-ai-stats-title">
              <Activity size={20} />
              Generation Statistics
            </h4>
            <div className="admin-ai-stats-grid">
              <div className="admin-ai-stat-item">
                <div className="admin-ai-stat-value">{generationStats.total}</div>
                <div className="admin-ai-stat-label">Total Questions</div>
              </div>
              {Object.entries(generationStats.bySource).map(([source, count]) => {
                const sourceInfo = sources.find(s => s.id === source);
                return (
                  <div key={source} className="admin-ai-stat-item">
                    <div className="admin-ai-stat-value">{count}</div>
                    <div className="admin-ai-stat-label">{sourceInfo.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generated Questions */}
        {generatedQuestions.length > 0 && (
          <div className="admin-ai-questions">
            <div className="admin-ai-questions-header">
              <h4 className="admin-ai-questions-title">
                <Code size={20} />
                Generated Questions ({filteredQuestions.length})
              </h4>
              
              {mode === 'partial' && (
                <div className="admin-ai-questions-actions">
                  <div className="admin-ai-filters">
                    <input 
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="admin-ai-search-input"
                    />
                    <select 
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="admin-ai-filter-select"
                    >
                      <option value="all">All Difficulties</option>
                      {difficulties.map(diff => (
                        <option key={diff.value} value={diff.value}>{diff.label}</option>
                      ))}
                    </select>
                    <select 
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="admin-ai-filter-select"
                    >
                      <option value="all">All Sources</option>
                      {sources.map(source => (
                        <option key={source.id} value={source.id}>{source.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-ai-selection-actions">
                    <button onClick={selectAllQuestions} className="admin-ai-select-btn">
                      Select All
                    </button>
                    <button onClick={deselectAllQuestions} className="admin-ai-select-btn">
                      Deselect All
                    </button>
                    <button 
                      onClick={() => setShowSaveModal(true)}
                      disabled={selectedQuestions.length === 0}
                      className="admin-ai-save-btn"
                    >
                      <Save size={16} />
                      Save Collection
                    </button>
                    <button 
                      onClick={exportQuestions}
                      disabled={selectedQuestions.length === 0}
                      className="admin-ai-export-btn"
                    >
                      <Download size={16} />
                      Export
                    </button>
                    <button 
                      onClick={() => navigate('/admin/exams/create', { state: { questions: selectedQuestions } })}
                      disabled={selectedQuestions.length === 0}
                      className="admin-ai-add-btn"
                    >
                      <Plus size={16} />
                      Use in Exam ({selectedQuestions.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-ai-questions-list">
              {filteredQuestions.map(question => (
                <div key={question.id} className="admin-ai-question-card">
                  <div className="admin-ai-question-header">
                    <div className="admin-ai-question-meta">
                      {mode === 'partial' && (
                        <input 
                          type="checkbox"
                          checked={selectedQuestions.some(q => q.id === question.id)}
                          onChange={() => toggleQuestionSelection(question.id)}
                          className="admin-ai-question-checkbox"
                        />
                      )}
                      <div className="admin-ai-question-title">{question.title}</div>
                      <div className="admin-ai-question-badges">
                        <span 
                          className="admin-ai-difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
                        >
                          {question.difficulty}
                        </span>
                        <span className="admin-ai-source-badge">
                          <question.source.icon size={14} />
                          {question.source.name}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => previewQuestionHandler(question)}
                      className="admin-ai-preview-btn"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                  
                  <div className="admin-ai-question-content">
                    <p className="admin-ai-question-description">{question.description}</p>
                    
                    <div className="admin-ai-question-details">
                      <div className="admin-ai-question-tags">
                        {question.tags.map(tag => (
                          <span key={tag} className="admin-ai-tag">{tag}</span>
                        ))}
                      </div>
                      
                      <div className="admin-ai-complexity">
                        <span className="admin-ai-complexity-item">
                          Time: {question.timeComplexity}
                        </span>
                        <span className="admin-ai-complexity-item">
                          Space: {question.spaceComplexity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Collections */}
        {savedCollections.length > 0 && (
          <div className="admin-ai-collections">
            <h4 className="admin-ai-collections-title">
              <FolderOpen size={20} />
              Saved Collections
            </h4>
            <div className="admin-ai-collections-grid">
              {savedCollections.map(collection => (
                <div key={collection.id} className="admin-ai-collection-card">
                  <div className="admin-ai-collection-header">
                    <h5>{collection.name}</h5>
                    <div className="admin-ai-collection-actions">
                      <button 
                        onClick={() => loadCollection(collection)}
                        className="admin-ai-collection-btn"
                      >
                        <Upload size={14} />
                        Load
                      </button>
                      <button 
                        onClick={() => deleteCollection(collection.id)}
                        className="admin-ai-collection-btn delete"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="admin-ai-collection-stats">
                    <span>{collection.stats.total} questions</span>
                    <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="admin-ai-collection-breakdown">
                    {Object.entries(collection.stats.byDifficulty).map(([diff, count]) => (
                      <span key={diff} className="admin-ai-collection-badge" style={{ backgroundColor: getDifficultyColor(diff) }}>
                        {diff}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Preview Modal */}
        {showPreview && previewQuestion && (
          <div className="admin-ai-preview-modal-premium">
            <div className="premium-modal-content">
              <div className="premium-modal-header">
                <div className="premium-header-title">
                  <h3>{previewQuestion.title}</h3>
                  <div className="premium-header-badges">
                    <span className={`premium-badge ${previewQuestion.difficulty}`}>
                      {previewQuestion.difficulty}
                    </span>
                    <span className="premium-badge">
                      <previewQuestion.source.icon size={14} />
                      {previewQuestion.source.name}
                    </span>
                    {previewQuestion.tags && previewQuestion.tags.map(tag => (
                      <span key={tag} className="premium-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="premium-modal-close"
                >
                  ×
                </button>
              </div>
              
              <div className="premium-modal-scroll-area">
                {/* Description Section */}
                <div className="premium-section">
                  <div className="premium-section-header">
                    <h4>Problem Statement</h4>
                    <div className="premium-section-line"></div>
                  </div>
                  <div className="premium-description">
                    {previewQuestion.description || previewQuestion.question_text}
                  </div>
                </div>
                
                {/* Constraints Section */}
                {previewQuestion.constraints && (
                  <div className="premium-section">
                    <div className="premium-section-header">
                      <h4>Constraints</h4>
                      <div className="premium-section-line"></div>
                    </div>
                    <ul className="premium-constraints-list">
                      {Array.isArray(previewQuestion.constraints) ? (
                        previewQuestion.constraints.map((constraint, index) => (
                          <li key={index}>{constraint}</li>
                        ))
                      ) : (
                        <li>{previewQuestion.constraints}</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Examples Section */}
                <div className="premium-section">
                  <div className="premium-section-header">
                    <h4>Examples</h4>
                    <div className="premium-section-line"></div>
                  </div>
                  <div className="premium-examples-list">
                    {(previewQuestion.examples || previewQuestion.testCases || []).map((example, index) => (
                      <div key={index} className="premium-example-item">
                        <div className="premium-example-label">Example {index + 1}</div>
                        <div className="premium-example-content">
                          <div className="premium-io-group">
                            <span className="premium-io-label">Input</span>
                            <div className="premium-io-code">{example.input}</div>
                          </div>
                          <div className="premium-io-group">
                            <span className="premium-io-label">Output</span>
                            <div className="premium-io-code output">{example.output}</div>
                          </div>
                          {example.explanation && (
                            <div className="premium-io-group">
                              <span className="premium-io-label">Explanation</span>
                              <div className="premium-description" style={{ fontSize: '0.9rem', padding: '0 0.5rem' }}>
                                {example.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Solution/Approach Section */}
                {previewQuestion.solution && (
                  <div className="premium-section">
                    <div className="premium-section-header">
                      <h4>Recommended Approach</h4>
                      <div className="premium-section-line"></div>
                    </div>
                    <div className="premium-description">
                      {previewQuestion.solution}
                    </div>
                  </div>
                )}
                
                {/* Code Template Section */}
                {previewQuestion.codeTemplate && (
                  <div className="premium-section">
                    <div className="premium-section-header">
                      <h4>Code Template</h4>
                      <div className="premium-section-line"></div>
                    </div>
                    <div className="premium-code-block">
                      <code>{previewQuestion.codeTemplate}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Collection Modal */}
        {showSaveModal && (
          <div className="admin-ai-save-modal">
            <div className="admin-ai-save-content">
              <div className="admin-ai-save-header">
                <h3>Save Question Collection</h3>
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="admin-ai-save-close"
                >
                  ×
                </button>
              </div>
              
              <div className="admin-ai-save-body">
                <div className="admin-ai-save-form">
                  <label className="admin-ai-save-label">Collection Name</label>
                  <input 
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Enter collection name..."
                    className="admin-ai-save-input"
                  />
                </div>
                
                <div className="admin-ai-save-stats">
                  <p>Selected Questions: {selectedQuestions.length}</p>
                  <div className="admin-ai-save-breakdown">
                    {Object.entries(
                      selectedQuestions.reduce((acc, q) => {
                        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([diff, count]) => (
                      <span key={diff} className="admin-ai-save-badge" style={{ backgroundColor: getDifficultyColor(diff) }}>
                        {diff}: {count}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="admin-ai-save-actions">
                  <button 
                    onClick={() => setShowSaveModal(false)}
                    className="admin-btn admin-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveToCollection}
                    className="admin-btn admin-btn-primary"
                  >
                    <Save size={16} />
                    Save Collection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIQuestionGenerator;
