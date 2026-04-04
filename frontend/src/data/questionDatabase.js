export const questionDatabase = {
  leetcode: {
    easy: [
      {
        title: "Two Sum",
        description: "Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.<br/><br/>You may assume that each input would have <b>exactly one solution</b>, and you may not use the same element twice.",
        tags: ["array", "hash-table"],
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        examples: [
          { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." }
        ],
        constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
        solution: "Use a hash map to store indices."
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
      }
    ],
    medium: [
      {
        title: "3Sum",
        description: "Given an integer array nums, return all the triplets that sum to zero.",
        tags: ["array", "two-pointers", "sorting"],
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(1) extra",
        examples: [
          { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }
        ],
        constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
        solution: "Sort and use two-pointer approach for each element."
      },
      {
        title: "Course Schedule",
        description: "There are a total of <code>numCourses</code> courses you have to take, labeled from <code>0</code> to <code>numCourses - 1</code>. You are given an array <code>prerequisites</code> where <code>prerequisites[i] = [ai, bi]</code> indicates that you must take course <code>bi</code> first if you want to take course <code>ai</code>.<br/><br/>Return <code>true</code> if you can finish all courses. Otherwise, return <code>false</code>.",
        tags: ["graph", "bfs", "dfs", "topological-sort"],
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V + E)",
        examples: [
          { input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" }
        ],
        constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000"],
        solution: "Detect cycle using Kahn's algorithm or DFS."
      }
    ]
  },
  codeforces: {
    easy: [
      {
        title: "Watermelon",
        description: "Pete and Billy want to divide a watermelon in such a way that each of the two parts weighs an even number of kilos, at the same time it is not obligatory that the parts are equal.",
        tags: ["math", "brute-force"],
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)",
        examples: [
          { input: "8", output: "YES" }
        ],
        constraints: ["1 <= w <= 100"],
        solution: "Output YES if w is even and greater than 2."
      }
    ]
  },
  geeksforgeeks: {
    easy: [
      {
        title: "Find triplets with zero sum",
        description: "Given an array of n integers, find if it has a triplet that sums to zero.",
        tags: ["array", "hashing"],
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(n)",
        examples: [{ input: "n=5, arr[]={0, -1, 2, -3, 1}", output: "1" }],
        constraints: ["1 <= n <= 10^4"],
        solution: "Use sorting or hashing."
      }
    ]
  }
};
